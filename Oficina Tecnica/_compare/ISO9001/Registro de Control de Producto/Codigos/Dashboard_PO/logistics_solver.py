from decimal import Decimal

class RotationType:
    RT_WHD = 0
    RT_HWD = 1
    RT_HDW = 2
    RT_DHW = 3
    RT_DWH = 4
    RT_WDH = 5

    ALL = [RT_WHD, RT_HWD, RT_HDW, RT_DHW, RT_DWH, RT_WDH]

class Item:
    def __init__(self, name, width, height, depth, weight, allowed_rotations=None):
        self.name = name
        self.width = width
        self.height = height
        self.depth = depth
        self.weight = weight
        self.volume = width * height * depth
        self.rotation_type = RotationType.RT_WHD
        self.position = [Decimal(0), Decimal(0), Decimal(0)]
        self.allowed_rotations = allowed_rotations if allowed_rotations is not None else RotationType.ALL
        # Boundary cache for fast overlap checks
        self.lx, self.rx = Decimal(0), Decimal(0)
        self.ly, self.ry = Decimal(0), Decimal(0)
        self.lz, self.rz = Decimal(0), Decimal(0)

    def get_dimension(self):
        if self.rotation_type == RotationType.RT_WHD:
            return [self.width, self.height, self.depth]
        elif self.rotation_type == RotationType.RT_HWD:
            return [self.height, self.width, self.depth]
        elif self.rotation_type == RotationType.RT_HDW:
            return [self.height, self.depth, self.width]
        elif self.rotation_type == RotationType.RT_DHW:
            return [self.depth, self.height, self.width]
        elif self.rotation_type == RotationType.RT_DWH:
            return [self.depth, self.width, self.height]
        elif self.rotation_type == RotationType.RT_WDH:
            return [self.width, self.depth, self.height]
        else:
            return [self.width, self.height, self.depth]

    def get_volume(self):
        return self.volume

    def string(self):
        return "%s(%sx%sx%s, weight: %s) pos(%s) rt(%s) vol(%s)" % (
            self.name, self.width, self.height, self.depth, self.weight,
            self.position, self.rotation_type, self.get_volume()
        )

class Bin:
    def __init__(self, name, width, height, depth, max_weight, allow_stacking=True):
        self.name = name
        self.width = width
        self.height = height
        self.depth = depth
        self.max_weight = max_weight
        self.allow_stacking = allow_stacking
        self.items = []
        self.used_volume = Decimal(0)
        self.used_weight = Decimal(0)
        self.pivots = [[Decimal(0), Decimal(0), Decimal(0)]]
    
    def get_volume(self):
        return self.width * self.height * self.depth

    def get_total_weight(self):
        return self.used_weight

    def get_remaining_volume(self):
        return self.get_volume() - self.used_volume

    def put_item(self, item, pivot, axis=None):
        valid = False
        
        # Try all rotation types
        # Heuristic: Try to align similar dimensions
        
        dims = item.get_dimension()
        w, h, d = dims[0], dims[1], dims[2]
        pos = pivot

        if (self.width < pos[0] + w or
            self.height < pos[1] + h or
            self.depth < pos[2] + d):
            return False

        # Check intersection
        for current_item in self.items:
            # Overlap test
            c_dims = current_item.get_dimension()
            c_pos = current_item.position
            
            # Check for overlap on all 3 axis
            # x overlap
            cond_x = (pos[0] < c_pos[0] + c_dims[0]) and (pos[0] + w > c_pos[0])
            # y overlap
            cond_y = (pos[1] < c_pos[1] + c_dims[1]) and (pos[1] + h > c_pos[1])
            # z overlap
            cond_z = (pos[2] < c_pos[2] + c_dims[2]) and (pos[2] + d > c_pos[2])

            if cond_x and cond_y and cond_z:
                return False

        return True


class Packer:
    def __init__(self):
        self.bins = []
        self.items = []
        self.unfit_items = []
        self.total_items = 0

    def add_bin(self, bin):
        self.bins.append(bin)

    def add_item(self, item):
        self.total_items = len(self.items) + 1
        self.items.append(item)

    def pack_to_bin(self, bin, item):
        # Volumetric/Weight Pre-check
        if item.get_volume() > bin.get_remaining_volume() or \
           bin.get_total_weight() + item.weight > bin.max_weight:
            return False

        # Sort rotations by height (ascending) to prefer flat placements
        possible_rots = []
        for r in item.allowed_rotations:
            item.rotation_type = r
            h = item.get_dimension()[1]
            possible_rots.append((h, r))
        possible_rots.sort(key=lambda x: x[0])

        # We iterate pivots (already sorted by Y, Z, X)
        force_orientation = getattr(item, 'force_orientation', False)
        for idx, pos in enumerate(bin.pivots):
             if not bin.allow_stacking and pos[1] != 0:
                 continue

             if force_orientation:
                 best = None
                 for _, rotation in possible_rots:
                     item.rotation_type = rotation
                     dims = item.get_dimension()
                     w, h, d = dims[0], dims[1], dims[2]

                     # Boundary check
                     if (pos[0] + w <= bin.width) and                         (pos[1] + h <= bin.height) and                         (pos[2] + d <= bin.depth):

                         # Overlap Check (Highly Optimized)
                         overlap = False
                         px_end, py_end, pz_end = pos[0]+w, pos[1]+h, pos[2]+d
                         for exist in bin.items:
                             if (pos[0] < exist.rx) and (px_end > exist.lx) and                                 (pos[1] < exist.ry) and (py_end > exist.ly) and                                 (pos[2] < exist.rz) and (pz_end > exist.lz):
                                 overlap = True
                                 break

                         if not overlap:
                             # Heuristic: prefer orientation that yields more tiles on this layer
                             if w <= 0 or d <= 0:
                                 continue
                             avail_w = bin.width - pos[0]
                             avail_d = bin.depth - pos[2]
                             if avail_w <= 0 or avail_d <= 0:
                                 continue
                             cnt_w = int(avail_w // w)
                             cnt_d = int(avail_d // d)
                             capacity = cnt_w * cnt_d
                             waste = (avail_w - (w * cnt_w)) + (avail_d - (d * cnt_d))
                             score = (capacity, -float(waste))

                             if best is None or score > best['score']:
                                 best = {
                                     'rotation': rotation,
                                     'w': w,
                                     'h': h,
                                     'd': d,
                                     'px_end': px_end,
                                     'py_end': py_end,
                                     'pz_end': pz_end,
                                     'score': score
                                 }

                 if best is not None:
                     # Place using best orientation for this pivot
                     item.rotation_type = best['rotation']
                     item.position = pos
                     item.lx, item.rx = pos[0], best['px_end']
                     item.ly, item.ry = pos[1], best['py_end']
                     item.lz, item.rz = pos[2], best['pz_end']

                     bin.items.append(item)
                     bin.used_volume += item.get_volume()
                     bin.used_weight += item.weight

                     # Update Persistent Pivots
                     bin.pivots.pop(idx)

                     potential_pivots = [
                         [item.rx, pos[1], pos[2]], # X-axis
                         [pos[0], item.ry, pos[2]], # Y-axis
                         [pos[0], pos[1], item.rz]  # Z-axis
                     ]

                     if not bin.allow_stacking:
                         potential_pivots = [
                             [item.rx, pos[1], pos[2]], # X-axis
                             [pos[0], pos[1], item.rz]  # Z-axis
                         ]

                     for np in potential_pivots:
                         if np[0] < bin.width and np[1] < bin.height and np[2] < bin.depth:
                             if np not in bin.pivots:
                                 bin.pivots.append(np)

                     # Keep pivots sorted by Y, then Z, then X
                     bin.pivots.sort(key=lambda p: (p[1], p[2], p[0]))
                     return True

                 continue

             for _, rotation in possible_rots:
                 item.rotation_type = rotation
                 dims = item.get_dimension()
                 w, h, d = dims[0], dims[1], dims[2]

                 # Boundary check
                 if (pos[0] + w <= bin.width) and                     (pos[1] + h <= bin.height) and                     (pos[2] + d <= bin.depth):

                     # Overlap Check (Highly Optimized)
                     overlap = False
                     px_end, py_end, pz_end = pos[0]+w, pos[1]+h, pos[2]+d
                     for exist in bin.items:
                         if (pos[0] < exist.rx) and (px_end > exist.lx) and                             (pos[1] < exist.ry) and (py_end > exist.ly) and                             (pos[2] < exist.rz) and (pz_end > exist.lz):
                             overlap = True
                             break

                     if not overlap:
                         # Found the best valid spot (first fit in sorted pivots)!
                         item.position = pos
                         item.lx, item.rx = pos[0], px_end
                         item.ly, item.ry = pos[1], py_end
                         item.lz, item.rz = pos[2], pz_end

                         bin.items.append(item)
                         bin.used_volume += item.get_volume()
                         bin.used_weight += item.weight

                         # Update Persistent Pivots
                         bin.pivots.pop(idx)

                         potential_pivots = [
                             [item.rx, pos[1], pos[2]], # X-axis
                             [pos[0], item.ry, pos[2]], # Y-axis
                             [pos[0], pos[1], item.rz]  # Z-axis
                         ]

                         if not bin.allow_stacking:
                             potential_pivots = [
                                 [item.rx, pos[1], pos[2]], # X-axis
                                 [pos[0], pos[1], item.rz]  # Z-axis
                             ]

                         for np in potential_pivots:
                             if np[0] < bin.width and np[1] < bin.height and np[2] < bin.depth:
                                 if np not in bin.pivots:
                                     bin.pivots.append(np)

                         # Keep pivots sorted by Y, then Z, then X
                         bin.pivots.sort(key=lambda p: (p[1], p[2], p[0]))
                         return True
        return False

    def pack(self, bigger_first=True, distribute_items=False, sort_items=True):
        # Sort items by volume DESC only if requested
        if sort_items:
            if bigger_first:
                self.items.sort(key=lambda item: item.get_volume(), reverse=True)
            else:
                self.items.sort(key=lambda item: item.get_volume(), reverse=False)

        # Sort bins by volume
        self.bins.sort(key=lambda bin: bin.get_volume())

        for bin in self.bins:
            # Try to pack items into this bin
            # If distribute_items is False, we try to put ALL items in the first bin, then remainder in second, etc.
            # But the current logic clears items list once packed? 
            # Better approach: Iterate items, if packed, mark as packed.
            
            packed_items = []
            
            # Iterate copy of list so we can modify or track
            # We want to fit as many as possible
            for item in self.items[:]:
                if self.pack_to_bin(bin, item):
                    packed_items.append(item)
                    self.items.remove(item) # Remove from global list so it's not packed again
            
            # Bin is done
        
        # Remaining items are unfitted
        self.unfit_items = self.items

    def pack_to_many_bins(self, bin_factory, items, sort_items=True):
        """
        Packs items into as many bins as needed using the bin_factory to create new bins.
        Returns a list of used bins.
        """
        # Sort items only if requested
        if sort_items:
             items_to_pack = sorted(items, key=lambda i: i.get_volume(), reverse=True)
        else:
             items_to_pack = list(items) # Copy list
        
        used_bins = []
        self.unfit_items = []
        
        while items_to_pack:
            # Create a new bin
            current_bin = bin_factory()
            packed_in_this_bin = []
            
            # 1. Determine smallest item volume for early-exit
            min_item_vol = items_to_pack[-1].get_volume() if items_to_pack else Decimal(0)
            
            # 2. Try to pack remaining items into this bin
            remaining_items = []
            for i, item in enumerate(items_to_pack):
                # Volumetric Saturation Check
                if current_bin.get_remaining_volume() < min_item_vol:
                     # This bin is saturated. Items are sorted by volume DESC, 
                     # so if the last (smallest) item doesn't fit, none will.
                     remaining_items.extend(items_to_pack[i:])
                     break

                if self.pack_to_bin(current_bin, item):
                    packed_in_this_bin.append(item)
                else:
                    remaining_items.append(item)
            
            if not packed_in_this_bin:
                # Critical Error: Item fits nowhere?
                # Add to unfit and break loop to avoid infinite loop
                self.unfit_items.extend(remaining_items) # All remaining are unfit
                break
                
            used_bins.append(current_bin)
            items_to_pack = remaining_items
            
        self.bins = used_bins
        return used_bins

