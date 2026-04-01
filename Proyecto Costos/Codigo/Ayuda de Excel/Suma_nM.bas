Attribute VB_Name = "Suma_nM"
Option Explicit

Public Sub SumarMinoristaMayorista()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("INFO-Embalaje")

    Dim lastRow As Long, r As Long, maxCol As Long
    lastRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row
    maxCol = ws.Cells(10, ws.Columns.Count).End(xlToLeft).Column

    For r = 13 To lastRow
        Dim depRange As String
        depRange = ws.Range(ws.Cells(r, 1), ws.Cells(r, maxCol + 2)).Address(False, False)
        ws.Cells(r, "DB").Formula = "=IF($CZ" & r & "="""",TotalMinorista(" & depRange & "),TotalMinorista(" & depRange & ")*$CZ" & r & ")"
        ws.Cells(r, "DC").Formula = "=IF($DA" & r & "="""",TotalMayorista(" & depRange & "),TotalMayorista(" & depRange & ")*$DA" & r & ")"
    Next r
End Sub

Private Function ParseQtyPair(raw As Variant, ByRef qMin As Double, ByRef qMay As Double) As Boolean
    If IsError(raw) Then Exit Function
    Dim s As String
    s = Replace$(CStr(raw), " ", "")
    If Len(s) = 0 Then Exit Function
    Dim parts() As String
    parts = Split(s, "-")
    On Error GoTo Fail
    If UBound(parts) = 0 Then
        If Not IsNumeric(parts(0)) Then GoTo Fail
        qMin = CDbl(parts(0)): qMay = qMin
    Else
        If Not IsNumeric(parts(0)) Or Not IsNumeric(parts(1)) Then GoTo Fail
        qMin = CDbl(parts(0)): qMay = CDbl(parts(1))
    End If
    ParseQtyPair = True
    Exit Function
Fail:
    ParseQtyPair = False
End Function

Private Function GetCosto(sh As Worksheet, code As String, costCol As Long, ByRef costo As Double) As Boolean
    Dim f As Range
    Set f = sh.Columns(2).Find(What:=code, LookAt:=xlWhole, MatchCase:=False)
    If Not f Is Nothing Then
        If IsNumeric(sh.Cells(f.Row, costCol).Value) Then
            costo = CDbl(sh.Cells(f.Row, costCol).Value)
            GetCosto = True
        End If
    End If
End Function

Public Function TotalMinorista(Optional rowArg As Variant) As Variant
    Dim r As Long
    r = ResolveRow(rowArg)
    If r = 0 Then
        TotalMinorista = CVErr(xlErrValue)
    Else
        TotalMinorista = SumNM(r, True)
    End If
End Function

Public Function TotalMayorista(Optional rowArg As Variant) As Variant
    Dim r As Long
    r = ResolveRow(rowArg)
    If r = 0 Then
        TotalMayorista = CVErr(xlErrValue)
    Else
        TotalMayorista = SumNM(r, False)
    End If
End Function

Public Function SumNM(dataRow As Long, isMinor As Boolean) As Double
    On Error GoTo SafeExit
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("INFO-Embalaje")

    Dim maxCol As Long, c As Long
    maxCol = ws.Cells(10, ws.Columns.Count).End(xlToLeft).Column

    ' Cache row headers and data to avoid muchas llamadas a celdas
    Dim headerCodes As Variant, headerFlags As Variant, dataRowVals As Variant
    headerCodes = ws.Range(ws.Cells(10, 1), ws.Cells(10, maxCol)).Value
    headerFlags = ws.Range(ws.Cells(12, 1), ws.Cells(12, maxCol)).Value
    ' Incluimos dos columnas extra (cantidades y longitudes) para cada código
    dataRowVals = ws.Range(ws.Cells(dataRow, 1), ws.Cells(dataRow, maxCol + 2)).Value

    Dim total As Double
    total = 0

    ' Cajas Micro/Corrug + Cartulina (se promedian juntas)
    Dim mcContribMin As New Collection, mcContribMay As New Collection
    Dim mcQtyMin As New Collection, mcQtyMay As New Collection
    ' Cajas Small/Medium/Large (se promedian juntas)
    Dim smlContribMin As New Collection, smlContribMay As New Collection
    Dim smlQtyMin As New Collection, smlQtyMay As New Collection
    Dim smlLenMin As New Collection, smlLenMay As New Collection
    ' Pallets (para I102/I103)
    Dim palletQtyMin As New Collection, palletQtyMay As New Collection
    Dim palletLen4Min As New Collection, palletLen4May As New Collection
    Dim palletLen5Min As New Collection, palletLen5May As New Collection

    Dim i101Seen As Boolean, i101HasMinor As Boolean, i101HasMayor As Boolean, i101Cost As Double
    Dim i104Seen As Boolean, i104HasMinor As Boolean, i104HasMayor As Boolean, i104Cost As Double
    Dim i105Seen As Boolean, i105HasMinor As Boolean, i105HasMayor As Boolean, i105Cost As Double
    Dim i104QtyMin As Double, i104QtyMay As Double
    Dim i105QtyMin As Double, i105QtyMay As Double
    Dim i102Seen As Boolean, i102HasMinor As Boolean, i102HasMayor As Boolean, i102Cost As Double
    Dim i103Seen As Boolean, i103HasMinor As Boolean, i103HasMayor As Boolean, i103Cost As Double
    Dim i102CustomLen As Double, i103CustomLen As Double
    Dim i102QtyMin As Double, i102QtyMay As Double
    Dim i103QtyMin As Double, i103QtyMay As Double

    For c = 1 To maxCol
        If IsError(headerFlags(1, c)) Then GoTo NextCol
        If InStr(1, LCase$(headerFlags(1, c)), "minorista", vbTextCompare) > 0 Then
            If IsError(headerCodes(1, c)) Then GoTo NextCol
            Dim code As String
            code = Trim$(headerCodes(1, c))
            If Len(code) > 0 Then
                Dim tgt As Worksheet, costCol As Long
                Dim tipoCaja As String, costo As Double, flejeLen As Double, rowCaja As Long
                Dim palletLen4 As Double, palletLen5 As Double
                Dim isCaja As Boolean, isPallet As Boolean
                isCaja = (Left$(code, 1) = "C")
                isPallet = (Left$(code, 1) = "P")

                If isCaja Then
                    If Not GetCajaData(code, tipoCaja, costo, flejeLen, rowCaja) Then GoTo NextCol
                ElseIf isPallet Then
                    If Not GetPalletData(code, costo, palletLen4, palletLen5, rowCaja) Then GoTo NextCol
                Else
                    If Not ResolveSheetAndCost(code, tgt, costCol) Then GoTo NextCol
                    If Not GetCosto(tgt, code, costCol, costo) Then GoTo NextCol
                End If

                If IsError(dataRowVals(1, c)) Then GoTo NextCol
                Dim mark As String
                mark = CStr(dataRowVals(1, c))
                Dim hasMinor As Boolean, hasMayor As Boolean
                hasMinor = (InStr(1, mark, "m", vbBinaryCompare) > 0)
                hasMayor = (InStr(1, mark, "M", vbBinaryCompare) > 0)
                If isMinor Then
                    If Not hasMinor Then GoTo NextCol
                Else
                    If Not hasMayor Then GoTo NextCol
                End If
                ' Limit contributions to the current target (avoid double-counting when mark is "m-M")
                If isMinor Then
                    hasMayor = False
                Else
                    hasMinor = False
                End If

                Dim qMin As Double, qMay As Double
                If code = "I101" Or code = "I104" Or code = "I105" Or code = "I102" Or code = "I103" Then
                    If Not ParseQtyPair(dataRowVals(1, c + 1), qMin, qMay) Then
                        qMin = 0: qMay = 0
                    End If
                Else
                    If Not ParseQtyPair(dataRowVals(1, c + 1), qMin, qMay) Then GoTo NextCol
                End If

                Dim contrMin As Double, contrMay As Double
                If qMin <> 0 Then contrMin = costo / qMin
                If qMay <> 0 Then contrMay = costo / qMay

                If isCaja Then
                    Select Case tipoCaja
                        Case "MC" ' micro + cartulina
                            If hasMinor Then CollectAdd mcContribMin, contrMin
                            If hasMayor Then CollectAdd mcContribMay, contrMay
                            If hasMinor And qMin > 0 Then CollectAdd mcQtyMin, qMin
                            If hasMayor And qMay > 0 Then CollectAdd mcQtyMay, qMay
                        Case "SML" ' small / medium / large
                            If hasMinor Then CollectAdd smlContribMin, contrMin
                            If hasMayor Then CollectAdd smlContribMay, contrMay
                            If flejeLen > 0 Then
                                If hasMinor Then CollectAdd smlLenMin, flejeLen
                                If hasMayor Then CollectAdd smlLenMay, flejeLen
                            End If
                            If hasMinor And qMin > 0 Then CollectAdd smlQtyMin, qMin
                            If hasMayor And qMay > 0 Then CollectAdd smlQtyMay, qMay
                        Case Else
                            If hasMinor Then total = total + contrMin
                            If hasMayor Then total = total + contrMay
                    End Select
                ElseIf isPallet Then
                    If hasMinor And qMin > 0 Then CollectAdd palletQtyMin, qMin
                    If hasMayor And qMay > 0 Then CollectAdd palletQtyMay, qMay
                    If hasMinor And palletLen4 > 0 Then CollectAdd palletLen4Min, palletLen4
                    If hasMayor And palletLen4 > 0 Then CollectAdd palletLen4May, palletLen4
                    If hasMinor And palletLen5 > 0 Then CollectAdd palletLen5Min, palletLen5
                    If hasMayor And palletLen5 > 0 Then CollectAdd palletLen5May, palletLen5
                    If hasMinor Then total = total + contrMin
                    If hasMayor Then total = total + contrMay
                ElseIf code = "I101" Then
                    i101Seen = True: i101Cost = costo
                    i101HasMinor = hasMinor: i101HasMayor = hasMayor
                ElseIf code = "I104" Then
                    i104Seen = True: i104Cost = costo
                    i104HasMinor = hasMinor: i104HasMayor = hasMayor
                    i104QtyMin = qMin: i104QtyMay = qMay
                ElseIf code = "I105" Then
                    i105Seen = True: i105Cost = costo
                    i105HasMinor = hasMinor: i105HasMayor = hasMayor
                    i105QtyMin = qMin: i105QtyMay = qMay
                ElseIf code = "I102" Then
                    i102Seen = True: i102Cost = costo
                    i102HasMinor = hasMinor: i102HasMayor = hasMayor
                    i102QtyMin = qMin: i102QtyMay = qMay
                    If IsNumeric(dataRowVals(1, c + 2)) Then i102CustomLen = CDbl(dataRowVals(1, c + 2))
                ElseIf code = "I103" Then
                    i103Seen = True: i103Cost = costo
                    i103HasMinor = hasMinor: i103HasMayor = hasMayor
                    i103QtyMin = qMin: i103QtyMay = qMay
                    If IsNumeric(dataRowVals(1, c + 2)) Then i103CustomLen = CDbl(dataRowVals(1, c + 2))
                Else
                    If hasMinor Then total = total + contrMin
                    If hasMayor Then total = total + contrMay
                End If
            End If
        End If
NextCol:
    Next c

    ' promedios de cajas
    If mcContribMin.Count > 0 Then total = total + AvgCollection(mcContribMin)
    If mcContribMay.Count > 0 Then total = total + AvgCollection(mcContribMay)
    If smlContribMin.Count > 0 Then total = total + AvgCollection(smlContribMin)
    If smlContribMay.Count > 0 Then total = total + AvgCollection(smlContribMay)

    ' fleje I101 (Small/Medium/Large)
    If i101Seen Then
        Dim effQtyMin As Double, effQtyMay As Double
        effQtyMin = IIf(smlQtyMin.Count > 0, AvgCollection(smlQtyMin), 0)
        effQtyMay = IIf(smlQtyMay.Count > 0, AvgCollection(smlQtyMay), 0)
        Dim factorMin As Double, factorMay As Double
        factorMin = IIf(smlLenMin.Count > 0, AvgCollection(smlLenMin), 0)
        factorMay = IIf(smlLenMay.Count > 0, AvgCollection(smlLenMay), 0)
        If i101HasMinor And effQtyMin <> 0 Then total = total + (i101Cost / effQtyMin) * factorMin
        If i101HasMayor And effQtyMay <> 0 Then total = total + (i101Cost / effQtyMay) * factorMay
    End If

    ' etiquetas térmicas
    If i104Seen Then
        Dim eff104Min As Double, eff104May As Double
        eff104Min = IIf(i104QtyMin > 0, i104QtyMin, IIf(smlQtyMin.Count > 0, AvgCollection(smlQtyMin), 0))
        eff104May = IIf(i104QtyMay > 0, i104QtyMay, IIf(smlQtyMay.Count > 0, AvgCollection(smlQtyMay), 0))
        If i104HasMinor And eff104Min <> 0 Then total = total + (i104Cost / eff104Min)
        If i104HasMayor And eff104May <> 0 Then total = total + (i104Cost / eff104May)
    End If
    If i105Seen Then
        Dim eff105Min As Double, eff105May As Double
        eff105Min = IIf(i105QtyMin > 0, i105QtyMin, IIf(mcQtyMin.Count > 0, AvgCollection(mcQtyMin), 0))
        eff105May = IIf(i105QtyMay > 0, i105QtyMay, IIf(mcQtyMay.Count > 0, AvgCollection(mcQtyMay), 0))
        If i105HasMinor And eff105Min <> 0 Then total = total + (i105Cost / eff105Min)
        If i105HasMayor And eff105May <> 0 Then total = total + (i105Cost / eff105May)
    End If

    ' Etiquetas/personalizados I102/I103 basadas en pallets
    If i102Seen Then
        Dim eff102QtyMin As Double, eff102QtyMay As Double
        eff102QtyMin = IIf(i102QtyMin > 0, i102QtyMin, IIf(palletQtyMin.Count > 0, AvgCollection(palletQtyMin), 0))
        eff102QtyMay = IIf(i102QtyMay > 0, i102QtyMay, IIf(palletQtyMay.Count > 0, AvgCollection(palletQtyMay), 0))
        Dim effLen4Min As Double, effLen4May As Double
        effLen4Min = IIf(i102CustomLen > 0, i102CustomLen, IIf(palletLen4Min.Count > 0, AvgCollection(palletLen4Min), 0))
        effLen4May = IIf(i102CustomLen > 0, i102CustomLen, IIf(palletLen4May.Count > 0, AvgCollection(palletLen4May), 0))
        If i102HasMinor And eff102QtyMin <> 0 Then total = total + (i102Cost * effLen4Min) / eff102QtyMin
        If i102HasMayor And eff102QtyMay <> 0 Then total = total + (i102Cost * effLen4May) / eff102QtyMay
    End If
    If i103Seen Then
        Dim eff103QtyMin As Double, eff103QtyMay As Double
        eff103QtyMin = IIf(i103QtyMin > 0, i103QtyMin, IIf(palletQtyMin.Count > 0, AvgCollection(palletQtyMin), 0))
        eff103QtyMay = IIf(i103QtyMay > 0, i103QtyMay, IIf(palletQtyMay.Count > 0, AvgCollection(palletQtyMay), 0))
        Dim effLen5Min As Double, effLen5May As Double
        effLen5Min = IIf(i103CustomLen > 0, i103CustomLen, IIf(palletLen5Min.Count > 0, AvgCollection(palletLen5Min), 0))
        effLen5May = IIf(i103CustomLen > 0, i103CustomLen, IIf(palletLen5May.Count > 0, AvgCollection(palletLen5May), 0))
        If i103HasMinor And eff103QtyMin <> 0 Then total = total + (i103Cost * effLen5Min) / eff103QtyMin
        If i103HasMayor And eff103QtyMay <> 0 Then total = total + (i103Cost * effLen5May) / eff103QtyMay
    End If

    SumNM = total
    Exit Function
SafeExit:
    SumNM = total
End Function

Private Function ResolveSheetAndCost(code As String, ByRef tgt As Worksheet, ByRef costCol As Long) As Boolean
    If Len(code) = 0 Then Exit Function
    If IsError(code) Then Exit Function
    Select Case Left$(code, 1)
        Case "E": Set tgt = ThisWorkbook.Worksheets("INFO-E"): costCol = 11 'K
        Case "F": Set tgt = ThisWorkbook.Worksheets("INFO-F"): costCol = 11 'K
        Case "C": Set tgt = ThisWorkbook.Worksheets("INFO-C"): costCol = 14 'N
        Case "P": Set tgt = ThisWorkbook.Worksheets("INFO-P"): costCol = 14 'N
        Case "I": Set tgt = ThisWorkbook.Worksheets("INFO-I"): costCol = 11 'K
        Case Else: Exit Function
    End Select
    ResolveSheetAndCost = True
End Function

Private Function ResolveRow(arg As Variant) As Long
    On Error GoTo Fail
    If IsMissing(arg) Then
        ResolveRow = Application.Caller.Row
        Exit Function
    End If
    If IsObject(arg) Then
        If TypeName(arg) = "Range" Then
            ResolveRow = arg.Cells(1, 1).Row
            Exit Function
        End If
    End If
    If IsNumeric(arg) Then
        ResolveRow = CLng(arg)
        Exit Function
    End If
Fail:
    ResolveRow = 0
End Function

Private Function GetCajaData(code As String, ByRef tipo As String, ByRef costo As Double, ByRef flejeLen As Double, ByRef rowCaja As Long) As Boolean
    Dim sh As Worksheet
    Set sh = ThisWorkbook.Worksheets("INFO-C")
    Dim f As Range
    Set f = sh.Columns(2).Find(What:=code, LookAt:=xlWhole, MatchCase:=False)
    If f Is Nothing Then Exit Function
    rowCaja = f.Row
    Dim desc As String
    desc = CStr(sh.Cells(rowCaja, 6).Value) 'col F Descripción
    tipo = ClassifyCaja(desc)
    If IsNumeric(sh.Cells(rowCaja, 14).Value) Then
        costo = CDbl(sh.Cells(rowCaja, 14).Value) 'col N costo unitario
    Else
        Exit Function
    End If
    If IsNumeric(sh.Cells(rowCaja + 3, 9).Value) Then flejeLen = CDbl(sh.Cells(rowCaja + 3, 9).Value)
    GetCajaData = True
End Function

Private Function GetPalletData(code As String, ByRef costo As Double, ByRef len4 As Double, ByRef len5 As Double, ByRef rowPal As Long) As Boolean
    Dim sh As Worksheet
    Set sh = ThisWorkbook.Worksheets("INFO-P")
    Dim f As Range
    Set f = sh.Columns(2).Find(What:=code, LookAt:=xlWhole, MatchCase:=False)
    If f Is Nothing Then Exit Function
    rowPal = f.Row
    If IsNumeric(sh.Cells(rowPal, 14).Value) Then
        costo = CDbl(sh.Cells(rowPal, 14).Value) 'col N
    Else
        Exit Function
    End If
    If IsNumeric(sh.Cells(rowPal + 3, 9).Value) Then len4 = CDbl(sh.Cells(rowPal + 3, 9).Value)
    If IsNumeric(sh.Cells(rowPal + 4, 9).Value) Then len5 = CDbl(sh.Cells(rowPal + 4, 9).Value)
    GetPalletData = True
End Function

Private Function ClassifyCaja(desc As String) As String
    Dim d As String
    d = LCase$(desc)
    If InStr(d, "small") > 0 Or InStr(d, "medium") > 0 Or InStr(d, "large") > 0 Then
        ClassifyCaja = "SML"
    ElseIf InStr(d, "cartulina") > 0 Or InStr(d, "micro") > 0 Or InStr(d, "corrug") > 0 Then
        ClassifyCaja = "MC"
    Else
        ClassifyCaja = "OTRO"
    End If
End Function

Private Sub CollectAdd(col As Collection, val As Double)
    On Error Resume Next
    col.Add val
    On Error GoTo 0
End Sub

Private Function AvgCollection(col As Collection) As Double
    Dim i As Long, s As Double
    If col Is Nothing Then Exit Function
    If col.Count = 0 Then Exit Function
    For i = 1 To col.Count
        s = s + CDbl(col(i))
    Next i
    AvgCollection = s / col.Count
End Function
