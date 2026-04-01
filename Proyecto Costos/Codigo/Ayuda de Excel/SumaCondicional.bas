Attribute VB_Name = "SumaCondicional"
Option Explicit

' ==============================================================
' SumaCondicionalAvanzada  (version con logica de Operarios H/V)
' ==============================================================
' Reglas (por FILA, en aislamiento):
' 1) Detecta roles presentes en E:Z. Los faltantes redistribuyen su peso entre los presentes.
' 2) Para el ROL del criterio (segun texto en C), detecta A/B/C presentes en E:Z.
'    Las faltantes redistribuyen su peso entre las presentes.
' 3) Si un codigo n-L aparece varias veces en la FILA, se divide por su frecuencia en la FILA.
' 4) Solo suma codigos de la COLUMNA ACTUAL (rangoE) cuyo n coincide con el rol del criterio.
' 5) Para Operarios, se usa la nueva semantica de codigos:
'    - "1"  : 100% exclusivo (entre operarios sin V se promedia, no se suma).
'    - "1-Hn": simultaneidad horizontal (mismo operario en varias maquinas). Reparte 100% entre los Hn.
'              Se pueden fijar porcentajes: "1-H1-30" reparte 30% a esa celda y el resto entre las demas H1.
'              Si solo hay una Hn en la fila, toma 100% aunque tenga porcentaje parcial.
'    - "1-V1": simultaneidad vertical (otro operario al mismo tiempo). Es un "sumar", no promedio.
'    - Combinado: "1-Hn-V1" aplica reparto H y suma con V.

Public Function SumaCondicionalAvanzada( _
    ByVal rangoC As Range, ByVal rangoD As Range, _
    ByVal rangoE As Range, ByVal rangoMN As Range, _
    ByVal criterio As String, _
    ByVal wRole1 As Double, ByVal wRole2 As Double, ByVal wRole3 As Double, _
    ByVal wActA As Double, ByVal wActB As Double, ByVal wActC As Double, _
    Optional ByVal separador As String = " - " _
) As Double

    On Error GoTo ErrHandler

    Dim arrC, arrD, arrE, arrMN
    Dim nRows As Long, nCols As Long
    Dim i As Long, j As Long
    Dim total As Double
    Dim totalOp As Double
    Dim plainSum() As Double, plainCount() As Long, vSum() As Double, hSum() As Double
    Dim esOperario As Boolean, colIdxInMN As Long, rolOperario As Long

    ' --- Validaciones de tamano ---
    If rangoC.Rows.Count <> rangoD.Rows.Count _
       Or rangoC.Rows.Count <> rangoE.Rows.Count _
       Or rangoC.Rows.Count <> rangoMN.Rows.Count Then
        SumaCondicionalAvanzada = CVErr(xlErrRef)
        Exit Function
    End If

    ' --- Cargar a memoria ---
    arrC = rangoC.Value2
    arrD = rangoD.Value2
    arrE = rangoE.Value2
    arrMN = rangoMN.Value2
    nRows = UBound(arrC, 1)
    nCols = UBound(arrMN, 2)
    ReDim plainSum(1 To nCols)
    ReDim plainCount(1 To nCols)
    ReDim vSum(1 To nCols)
    ReDim hSum(1 To nCols)

    ' --- Column index of rangoE inside rangoMN ---
    colIdxInMN = rangoE.Column - rangoMN.Column + 1
    If colIdxInMN < 1 Or colIdxInMN > nCols Then
        SumaCondicionalAvanzada = CVErr(xlErrRef)
        Exit Function
    End If

    esOperario = CriterioEsOperario(criterio)

    ' --- Normalizar pesos (acepta 75 o 0,75) ---
    Dim wRole(1 To 3) As Double, wAct(1 To 3) As Double
    wRole(1) = NormalizeWeight(wRole1)
    wRole(2) = NormalizeWeight(wRole2)
    wRole(3) = NormalizeWeight(wRole3)
    wAct(1) = NormalizeWeight(wActA)
    wAct(2) = NormalizeWeight(wActB)
    wAct(3) = NormalizeWeight(wActC)

    ' === Procesar cada FILA en aislamiento ===
    For i = 1 To nRows

        Dim Dval As Double
        If IsNumeric(arrD(i, 1)) Then Dval = CDbl(arrD(i, 1)) Else Dval = 0#
        If Dval <= 0# Then GoTo NextRow

        ' Texto de C contiene el criterio? (defensivo)
        Dim txtC As String
        txtC = SafeText(arrC(i, 1))
        If Len(txtC) = 0 Then GoTo NextRow
        If InStr(1, txtC, criterio, vbTextCompare) = 0 Then GoTo NextRow

        ' Rol correspondiente (1..3)
        Dim rolCrit As Long
        rolCrit = RolCorrespondiente(txtC, criterio, separador)
        If rolCrit = 0 Then GoTo NextRow
        rolOperario = rolCrit

        ' --------- Construir array de TOKENS de la FILA (E:Z) ----------
        Dim tokensFila As Variant
        If esOperario Then
            tokensFila = RowTokensOp(arrMN, i, nCols)
        Else
            tokensFila = RowTokensGeneral(arrMN, i, nCols)
        End If

        ' --- Modo especial Operarios con codigos n / H / V ---
        If esOperario Then
            Dim tokenCelda As String, share As Double, tieneV As Boolean
            tokenCelda = FirstOperarioToken(arrMN(i, colIdxInMN), rolOperario)
            If Len(tokenCelda) = 0 Then GoTo NextRow

            Dim roleShareOp As Double
            roleShareOp = OperarioRoleShare(rolOperario, tokensFila, wRole)

            share = OperarioShareForCell(arrMN, i, nCols, colIdxInMN, tokenCelda, rolOperario, tieneV)
            If share <= 0# Then GoTo NextRow

            If tieneV Then
                vSum(colIdxInMN) = vSum(colIdxInMN) + (Dval * roleShareOp * share)
            ElseIf Len(tokenCelda) > 0 And InStr(1, tokenCelda, "H", vbTextCompare) > 0 Then
                hSum(colIdxInMN) = hSum(colIdxInMN) + (Dval * roleShareOp * share)
            Else
                plainSum(colIdxInMN) = plainSum(colIdxInMN) + (Dval * roleShareOp * share)
                plainCount(colIdxInMN) = plainCount(colIdxInMN) + 1
            End If

            GoTo NextRow
        End If

        If IsEmpty(tokensFila) Then GoTo NextRow
        If Not RolePresent(tokensFila, rolCrit) Then GoTo NextRow

        ' --------- Share por ROL en la FILA ----------
        Dim roleShare As Double
        roleShare = RoleShareForRow(tokensFila, rolCrit, wRole)

        ' --------- Share por ACTIVIDAD dentro del ROL en la FILA ----------
        Dim actShare() As Double
        actShare = ActShareForRow(tokensFila, rolCrit, wAct)

        ' --------- Sumar SOLO la COLUMNA ACTUAL (rangoE) ----------
        Dim cellStr As String
        cellStr = ""
        If Not IsError(arrE(i, 1)) Then cellStr = Trim$(CStr(arrE(i, 1)))

        ' Si no es operario y la celda es puramente numerica (ej. "1"), se ignora sin error
        If Not esOperario Then
            If Len(cellStr) > 0 And IsNumeric(cellStr) Then GoTo NextRow
        End If

        If Len(cellStr) > 0 Then
            Dim tokensCelda As Variant
            tokensCelda = SplitTokens(cellStr)

            If Not IsEmpty(tokensCelda) Then
                Dim lb As Long, ub As Long
                On Error Resume Next
                lb = LBound(tokensCelda): ub = UBound(tokensCelda)
                If Err.Number <> 0 Then ub = -1: Err.Clear
                On Error GoTo 0

                If ub >= lb Then
                    For j = lb To ub
                        Dim tk As String: tk = tokensCelda(j)
                        If IsValidToken(tk) Then
                            Dim r As Long, a As Long
                            ParseToken tk, r, a
                            If r = rolCrit Then
                                Dim f As Long
                                f = TokenCountInArray(tokensFila, tk)
                                If f < 1 Then f = 1
                                total = total + (Dval * roleShare * actShare(a)) / f
                            End If
                        End If
                    Next j
                End If
            End If
        End If

NextRow:
    Next i

    If esOperario Then
        Dim c As Long, buckets As Long, blended As Double
        For c = 1 To nCols
            If vSum(c) > 0 Then
                ' Caso con V: V suma, plain suma, H suma
                totalOp = totalOp + vSum(c) + plainSum(c) + hSum(c)
            ElseIf hSum(c) > 0 And plainCount(c) > 0 Then
                ' Caso H + 1 sin V: promedio entre 100% y share H
                buckets = plainCount(c) + 1
                blended = (plainSum(c) + hSum(c)) / buckets
                totalOp = totalOp + blended
            ElseIf plainCount(c) > 0 Then
                totalOp = totalOp + (plainSum(c) / plainCount(c))
            Else
                totalOp = totalOp + hSum(c)
            End If
        Next c
        SumaCondicionalAvanzada = totalOp
    Else
        SumaCondicionalAvanzada = total
    End If
    Exit Function

ErrHandler:
    SumaCondicionalAvanzada = 0#
End Function

' ==============================================================
' Helpers puros (sin diccionarios, sin COM)
' ==============================================================

Private Function NormalizeLabel(ByVal txt As String) As String
    txt = LCase$(Trim$(txt))
    If Len(txt) > 1 And Right$(txt, 1) = "s" Then txt = Left$(txt, Len(txt) - 1) ' tolera plural/singular
    NormalizeLabel = txt
End Function

Private Function CriterioEsOperario(ByVal criterio As String) As Boolean
    CriterioEsOperario = (NormalizeLabel(criterio) = "operario")
End Function

Private Function RolCorrespondiente(ByVal textoRol As String, ByVal criterio As String, _
                                    ByVal separador As String) As Long
    Dim p() As String, n As Long
    p = Split(Trim$(textoRol), separador)
    For n = LBound(p) To UBound(p)
        If NormalizeLabel(p(n)) = NormalizeLabel(criterio) Then
            RolCorrespondiente = n - LBound(p) + 1
            Exit Function
        End If
    Next n
    RolCorrespondiente = 0
End Function

' Devuelve string vacio si hay error o Null
Private Function SafeText(val As Variant) As String
    If IsError(val) Then Exit Function
    If IsNull(val) Then Exit Function
    SafeText = CStr(val)
End Function

Private Function IsValidToken(ByVal s As String) As Boolean
    Dim q() As String
    s = UCase$(Trim$(s))
    s = Replace(s, "--", "-")
    s = Replace(s, " -", "-")
    s = Replace(s, "- ", "-")

    If Len(s) = 0 Then Exit Function
    If InStr(1, s, "-", vbTextCompare) = 0 Then Exit Function
    q = Split(s, "-")
    If UBound(q) <> 1 Then Exit Function
    If Not IsNumeric(Trim$(q(0))) Then Exit Function
    Select Case UCase$(Trim$(q(1)))
        Case "A", "B", "C"
            IsValidToken = True
    End Select
End Function


Private Sub ParseToken(ByVal s As String, ByRef r As Long, ByRef a As Long)
    Dim q() As String
    q = Split(UCase$(Trim$(s)), "-")
    r = CLng(Trim$(q(0)))
    Select Case Trim$(q(1))
        Case "A": a = 1
        Case "B": a = 2
        Case "C": a = 3
    End Select
End Sub

' Construye array de tokens de TODA la FILA (E:Z) - modo Operario (acepta n, n-H/V)
Private Function RowTokensOp(ByRef arrMN As Variant, ByVal i As Long, ByVal nCols As Long) As Variant
    Dim tmp() As String
    Dim count As Long: count = 0
    Dim j As Long

    For j = 1 To nCols
        Dim s As String: s = ""
        If Not IsError(arrMN(i, j)) Then s = Trim$(CStr(arrMN(i, j)))
        If Len(s) > 0 Then
            Dim parts() As String, t As Long
            parts = SplitTokens(s)
            
            Dim lb As Long, ub As Long
            On Error Resume Next
            lb = LBound(parts): ub = UBound(parts)
            If Err.Number <> 0 Then ub = -1: Err.Clear
            On Error GoTo 0

            If ub >= lb Then
                For t = lb To ub
                    If IsValidToken(parts(t)) Or RoleNumFromToken(parts(t)) > 0 Then
                        count = count + 1
                        ReDim Preserve tmp(1 To count)
                        tmp(count) = UCase$(Trim$(parts(t)))
                    End If
                Next t
            End If
        End If
    Next j

    If count = 0 Then
        RowTokensOp = Empty
    Else
        RowTokensOp = tmp
    End If
End Function

' Construye array de tokens de TODA la FILA (E:Z) - modo general (solo n-A/B/C)
Private Function RowTokensGeneral(ByRef arrMN As Variant, ByVal i As Long, ByVal nCols As Long) As Variant
    Dim tmp() As String
    Dim count As Long: count = 0
    Dim j As Long

    For j = 1 To nCols
        Dim s As String: s = ""
        If Not IsError(arrMN(i, j)) Then s = Trim$(CStr(arrMN(i, j)))
        If Len(s) > 0 Then
            Dim parts() As String, t As Long
            parts = SplitTokens(s)

            Dim lb As Long, ub As Long
            On Error Resume Next
            lb = LBound(parts): ub = UBound(parts)
            If Err.Number <> 0 Then ub = -1: Err.Clear
            On Error GoTo 0

            If ub >= lb Then
                For t = lb To ub
                    If IsValidToken(parts(t)) Or RoleNumFromToken(parts(t)) > 0 Then
                        count = count + 1
                        ReDim Preserve tmp(1 To count)
                        tmp(count) = UCase$(Trim$(parts(t)))
                    End If
                Next t
            End If
        End If
    Next j

    If count = 0 Then
        RowTokensGeneral = Empty
    Else
        RowTokensGeneral = tmp
    End If
End Function

' Divide entradas flexibles como "1A / 2B", "1-A/2-B", "1A,2b" en tokens validos "n-L"
Private Function SplitTokens(ByVal s As String) As Variant
    Dim parts() As String, res() As String
    Dim i As Long, c As Long, t As String

    ' 1) Normalizar separadores externos (NO tocar el guion interno de n-L)
    s = Replace(s, ";", "/")
    s = Replace(s, ",", "/")
    s = Replace(s, "\", "/")

    ' 2) Quitar espacios globales (para tolerar "1-A / 2B", "1A /2b", etc.)
    s = Replace(s, " ", "")

    ' 3) Split solo por "/"
    parts = Split(s, "/")
    c = -1

    For i = LBound(parts) To UBound(parts)
        t = UCase$(Trim$(parts(i)))
        If Len(t) = 0 Then GoTo NextPart

        ' Si es puramente numerico (ej. "1"), conservarlo como token numerico
        If IsNumeric(t) Then
            c = c + 1
            ReDim Preserve res(0 To c)
            res(c) = t
            GoTo NextPart
        End If

        ' 4) Si falta el guion interno (ej. "1A" -> "1-A")
        If InStr(1, t, "-", vbTextCompare) = 0 Then
            Dim j As Long
            For j = 1 To Len(t)
                If Mid$(t, j, 1) Like "[A-Z]" Then
                    t = Left$(t, j - 1) & "-" & Mid$(t, j)
                    Exit For
                End If
            Next j
        End If

        ' 5) Validar tokens que empiecen con rol numerico aunque no sean A/B/C (ej. "1-H1")
        If RoleNumFromToken(t) > 0 Then
            c = c + 1
            ReDim Preserve res(0 To c)
            res(c) = t
            GoTo NextPart
        End If

        ' 6) Validar formato final "n-L" (numero 1..; letra A/B/C)
        If IsValidToken(t) Then
            c = c + 1
            ReDim Preserve res(0 To c)
            res(c) = t
        End If
NextPart:
    Next i

    If c < 0 Then
        SplitTokens = Empty
    Else
        SplitTokens = res
    End If
End Function

' Devuelve el numero de rol (parte numerica antes del primer "-") o 0 si no corresponde
Private Function RoleNumFromToken(ByVal token As String) As Long
    Dim p As Long, head As String
    token = Trim$(token)
    If Len(token) = 0 Then Exit Function
    p = InStr(1, token, "-", vbTextCompare)
    If p > 1 Then
        head = Left$(token, p - 1)
    Else
        head = token
    End If
    If IsNumeric(head) Then RoleNumFromToken = CLng(head)
End Function


Private Function RolePresent(ByRef tokens As Variant, ByVal rol As Long) As Boolean
    Dim i As Long, r As Long, a As Long
    If IsEmpty(tokens) Then Exit Function
    Dim lb As Long, ub As Long
    On Error Resume Next
    lb = LBound(tokens): ub = UBound(tokens)
    If Err.Number <> 0 Then Exit Function
    On Error GoTo 0

    For i = lb To ub
        r = RoleNumFromToken(tokens(i))
        If r = rol Then
            RolePresent = True
            Exit Function
        End If
    Next i
End Function

Private Function TokenCountInArray(ByRef tokens As Variant, ByVal token As String) As Long
    Dim i As Long, cnt As Long
    If IsEmpty(tokens) Then Exit Function
    Dim lb As Long, ub As Long
    On Error Resume Next
    lb = LBound(tokens): ub = UBound(tokens)
    If Err.Number <> 0 Then Exit Function
    On Error GoTo 0

    token = UCase$(Trim$(token))
    For i = lb To ub
        If tokens(i) = token Then cnt = cnt + 1
    Next i
    TokenCountInArray = cnt
End Function

Private Function RoleShareForRow(ByRef tokens As Variant, ByVal rol As Long, ByRef wRole() As Double) As Double
    Dim present(1 To 3) As Boolean
    Dim i As Long, r As Long, a As Long, k As Long
    Dim rolesCount As Long, missRole As Double

    If IsEmpty(tokens) Then RoleShareForRow = 0#: Exit Function
    Dim lb As Long, ub As Long
    On Error Resume Next
    lb = LBound(tokens): ub = UBound(tokens)
    If Err.Number <> 0 Then RoleShareForRow = 0#: Exit Function
    On Error GoTo 0

    For i = lb To ub
        r = RoleNumFromToken(tokens(i))
        If r >= 1 And r <= 3 Then present(r) = True
    Next i

    For k = 1 To 3
        If present(k) Then rolesCount = rolesCount + 1 Else missRole = missRole + wRole(k)
    Next k

    If rolesCount <= 1 Then
        RoleShareForRow = 1#
    Else
        RoleShareForRow = wRole(rol) + missRole / rolesCount
    End If
End Function

' Role share considerando que el rol del operario siempre esta presente,
' y los otros roles se detectan via tokens n-L (logica vieja).
Private Function OperarioRoleShare(ByVal rolOperario As Long, ByRef tokens As Variant, ByRef wRole() As Double) As Double
    Dim present(1 To 3) As Boolean
    Dim k As Long, rolesCount As Long, missRole As Double

    If rolOperario >= 1 And rolOperario <= 3 Then present(rolOperario) = True

    If Not IsEmpty(tokens) Then
        For k = 1 To 3
            If RolePresent(tokens, k) Then present(k) = True
        Next k
    End If

    For k = 1 To 3
        If present(k) Then
            rolesCount = rolesCount + 1
        Else
            missRole = missRole + wRole(k)
        End If
    Next k

    If rolesCount <= 1 Then
        OperarioRoleShare = 1#
    Else
        OperarioRoleShare = wRole(rolOperario) + missRole / rolesCount
    End If
End Function

' Normaliza peso: si no es numerico devuelve 0; si es >1 lo interpreta como porcentaje (ej. 75 -> 0,75)
Private Function NormalizeWeight(val As Variant) As Double
    If Not IsNumeric(val) Then
        NormalizeWeight = 0#
        Exit Function
    End If
    Dim d As Double
    d = CDbl(val)
    If d > 1# Then d = d / 100#
    If d < 0# Then d = 0#
    NormalizeWeight = d
End Function

' Detecta si en una columna hay al menos un token de operario valido (rol coincide)
Private Function HasOperarioTokenInColumn(ByRef arrMN As Variant, ByVal nRows As Long, ByVal nCols As Long, ByVal colIdx As Long) As Boolean
    Dim r As Long
    On Error Resume Next
    For r = 1 To nRows
        Dim tk As String
        ' Probamos con rol 1..3 porque aun no sabemos cual es el rol operario en esa fila
        tk = FirstOperarioToken(arrMN(r, colIdx), 1)
        If Len(tk) > 0 Then HasOperarioTokenInColumn = True: Exit Function
        tk = FirstOperarioToken(arrMN(r, colIdx), 2)
        If Len(tk) > 0 Then HasOperarioTokenInColumn = True: Exit Function
        tk = FirstOperarioToken(arrMN(r, colIdx), 3)
        If Len(tk) > 0 Then HasOperarioTokenInColumn = True: Exit Function
    Next r
    On Error GoTo 0
End Function

Private Function ActShareForRow(ByRef tokens As Variant, ByVal rol As Long, ByRef wAct() As Double) As Double()
    Dim pres(1 To 3) As Boolean
    Dim i As Long, r As Long, a As Long, k As Long
    Dim actsCount As Long, missAct As Double
    Dim res(1 To 3) As Double

    If IsEmpty(tokens) Then
        ActShareForRow = res
        Exit Function
    End If

    Dim lb As Long, ub As Long
    On Error Resume Next
    lb = LBound(tokens): ub = UBound(tokens)
    If Err.Number <> 0 Then ActShareForRow = res: Exit Function
    On Error GoTo 0

    For i = lb To ub
        If InStr(1, tokens(i), "-", vbTextCompare) > 0 Then
            ParseToken tokens(i), r, a
            If r = rol Then
                If a >= 1 And a <= 3 Then pres(a) = True
            End If
        End If
    Next i

    For k = 1 To 3
        If pres(k) Then
            actsCount = actsCount + 1
        Else
            missAct = missAct + wAct(k)
        End If
    Next k

    If actsCount <= 1 Then
        For k = 1 To 3
            If pres(k) Then res(k) = 1#
        Next k
    Else
        For k = 1 To 3
            If pres(k) Then res(k) = wAct(k) + missAct / actsCount
        Next k
    End If

    ActShareForRow = res
End Function

' ==============================================================
' UDF especifica para Operarios (solo H/V, sin actividades A/B/C)
' Firma reducida para evitar #VALOR cuando se usa solo con operarios
' ==============================================================
Public Function SumaCondicionalOperario( _
    ByVal rangoC As Range, ByVal rangoD As Range, _
    ByVal rangoE As Range, ByVal rangoMN As Range, _
    ByVal criterio As String, _
    ByVal wRole1 As Variant, ByVal wRole2 As Variant, ByVal wRole3 As Variant, _
    Optional ByVal separador As String = " - " _
) As Variant

    Dim arrC, arrD, arrMN
    Dim nRows As Long, nCols As Long
    Dim i As Long
    Dim totalOp As Double
    Dim colIdxInMN As Long, rolCrit As Long
    Dim plainSum() As Double, plainCount() As Long, vSum() As Double, hSum() As Double

    On Error GoTo ErrHandler

    If rangoC.Rows.Count <> rangoD.Rows.Count _
       Or rangoC.Rows.Count <> rangoE.Rows.Count _
       Or rangoC.Rows.Count <> rangoMN.Rows.Count Then
        SumaCondicionalOperario = CVErr(xlErrRef)
        Exit Function
    End If

    arrC = rangoC.Value2
    arrD = rangoD.Value2
    arrMN = rangoMN.Value2
    nRows = UBound(arrC, 1)
    nCols = UBound(arrMN, 2)
    ReDim plainSum(1 To nCols)
    ReDim plainCount(1 To nCols)
    ReDim vSum(1 To nCols)
    ReDim hSum(1 To nCols)

    colIdxInMN = rangoE.Column - rangoMN.Column + 1
    If colIdxInMN < 1 Or colIdxInMN > nCols Then
        SumaCondicionalOperario = CVErr(xlErrRef)
        Exit Function
    End If

    Dim wRole(1 To 3) As Double
    wRole(1) = NormalizeWeight(wRole1)
    wRole(2) = NormalizeWeight(wRole2)
    wRole(3) = NormalizeWeight(wRole3)

    For i = 1 To nRows
        Dim txtC As String
        txtC = SafeText(arrC(i, 1))
        If Len(txtC) = 0 Then GoTo NextRowOp
        If InStr(1, txtC, criterio, vbTextCompare) = 0 Then GoTo NextRowOp

        rolCrit = RolCorrespondiente(txtC, criterio, separador)
        If rolCrit = 0 Then GoTo NextRowOp

        Dim Dval As Double
        If IsNumeric(arrD(i, 1)) Then Dval = CDbl(arrD(i, 1)) Else Dval = 0#
        If Dval <= 0# Then GoTo NextRowOp

        Dim tokenCelda As String, share As Double, tieneV As Boolean
        tokenCelda = FirstOperarioToken(arrMN(i, colIdxInMN), rolCrit)
        If Len(tokenCelda) = 0 Then GoTo NextRowOp

        Dim tokensFila As Variant
        tokensFila = RowTokensOp(arrMN, i, nCols)

        Dim roleShareOp As Double
        roleShareOp = OperarioRoleShare(rolCrit, tokensFila, wRole)

        share = OperarioShareForCell(arrMN, i, nCols, colIdxInMN, tokenCelda, rolCrit, tieneV)
        If share <= 0# Then GoTo NextRowOp

        If tieneV Then
            vSum(colIdxInMN) = vSum(colIdxInMN) + (Dval * roleShareOp * share)
        ElseIf Len(tokenCelda) > 0 And InStr(1, tokenCelda, "H", vbTextCompare) > 0 Then
            hSum(colIdxInMN) = hSum(colIdxInMN) + (Dval * roleShareOp * share)
        Else
            plainSum(colIdxInMN) = plainSum(colIdxInMN) + (Dval * roleShareOp * share)
            plainCount(colIdxInMN) = plainCount(colIdxInMN) + 1
        End If

NextRowOp:
    Next i

    Dim c As Long, buckets As Long, blended As Double
    For c = 1 To nCols
        If vSum(c) > 0 Then
            totalOp = totalOp + vSum(c) + plainSum(c) + hSum(c)
        ElseIf hSum(c) > 0 And plainCount(c) > 0 Then
            buckets = plainCount(c) + 1
            blended = (plainSum(c) + hSum(c)) / buckets
            totalOp = totalOp + blended
        ElseIf plainCount(c) > 0 Then
            totalOp = totalOp + (plainSum(c) / plainCount(c))
        Else
            totalOp = totalOp + hSum(c)
        End If
    Next c

    SumaCondicionalOperario = totalOp
    Exit Function

ErrHandler:
    SumaCondicionalOperario = 0#
End Function

' ==============================================================
' Helpers para Operarios (H/V)
' ==============================================================

' Devuelve el primer token valido de operario (ej. "n", "n-H1-50", "n-V1", "n-H1-V1") segun numero de rol
Private Function FirstOperarioToken(ByVal raw As Variant, ByVal roleNum As Long) As String
    If IsError(raw) Then Exit Function
    Dim s As String
    s = Trim$(CStr(raw))
    If Len(s) = 0 Then Exit Function

    s = Replace(s, ";", "/")
    s = Replace(s, ",", "/")
    s = Replace(s, "\", "/")

    Dim parts() As String, i As Long
    parts = Split(s, "/")
    For i = LBound(parts) To UBound(parts)
        Dim t As String
        t = Trim$(parts(i))
        If Len(t) = 0 Then GoTo NextPart
        Dim dummyH As String, dummyPct As Double, dummyV As Boolean, isValid As Boolean
        ParseOperarioToken t, roleNum, dummyH, dummyPct, dummyV, isValid
        If isValid Then
            FirstOperarioToken = t
            Exit Function
        End If
NextPart:
    Next i
End Function

' Parsea token; devuelve groupH ("H1"), pct (0..1, 0 si no esta), tieneV y flag valido
Private Sub ParseOperarioToken(ByVal token As String, ByVal roleNum As Long, ByRef groupH As String, ByRef pct As Double, ByRef tieneV As Boolean, ByRef isValid As Boolean)
    groupH = "": pct = 0#: tieneV = False: isValid = False
    If Len(token) = 0 Then Exit Sub
    Dim s As String
    s = Replace$(token, " ", "")
    Dim parts() As String
    parts = Split(s, "-")
    If UBound(parts) < 0 Then Exit Sub
    If CStr(roleNum) <> parts(0) Then Exit Sub

    Dim k As Long
    For k = 1 To UBound(parts)
        Dim p As String
        p = UCase$(Trim$(parts(k)))
        If Len(p) = 0 Then GoTo InvalidToken

        If Left$(p, 1) = "H" Then
            ' Hn obligatorio que el resto sea numerico
            If Len(p) = 1 Then GoTo InvalidToken
            If Not IsNumeric(Mid$(p, 2)) Then GoTo InvalidToken
            groupH = p
        ElseIf p = "V1" Then
            tieneV = True
        ElseIf IsNumeric(p) Then
            pct = CDbl(p)
            If pct > 1 Then pct = pct / 100#
        Else
            GoTo InvalidToken
        End If
    Next k

    isValid = True
    Exit Sub

InvalidToken:
    isValid = False
End Sub

' Calcula el share para la celda actual segun los Hn presentes en toda la fila
Private Function OperarioShareForCell(ByRef arrMN As Variant, ByVal rowIdx As Long, ByVal nCols As Long, ByVal colIdx As Long, ByVal token As String, ByVal roleNum As Long, ByRef tieneV As Boolean) As Double
    Dim groupH As String, pct As Double, isValid As Boolean
    ParseOperarioToken token, roleNum, groupH, pct, tieneV, isValid
    If Not isValid Then Exit Function

    ' Sin grupo H: share pleno o el pct si se especifico
    If Len(groupH) = 0 Then
        If pct > 0 Then
            OperarioShareForCell = pct
        Else
            OperarioShareForCell = 1#
        End If
        Exit Function
    End If

    ' Con grupo H: mirar toda la fila para ese grupo
    Dim members As Long, specified As Double, specifiedCount As Long, unspecifiedCount As Long
    Dim j As Long
    For j = 1 To nCols
        Dim tk As String
        tk = FirstOperarioToken(arrMN(rowIdx, j), roleNum)
        If Len(tk) = 0 Then GoTo NextCol
        Dim gH As String, p As Double, hasVtmp As Boolean, ok As Boolean
        ParseOperarioToken tk, roleNum, gH, p, hasVtmp, ok
        If ok And gH = groupH Then
            members = members + 1
            If p > 0 Then
                specified = specified + p
                specifiedCount = specifiedCount + 1
            Else
                unspecifiedCount = unspecifiedCount + 1
            End If
        End If
NextCol:
    Next j

    If members = 0 Then Exit Function
    If members = 1 Then
        OperarioShareForCell = 1#
        Exit Function
    End If

    Dim share As Double
    If specified >= 1# Then
        ' Normalizar entre los especificados
        If pct > 0 Then
            share = pct / specified
        Else
            share = 0#
        End If
    Else
        Dim restante As Double
        restante = 1# - specified
        If pct > 0 Then
            share = pct
        ElseIf unspecifiedCount > 0 Then
            share = restante / unspecifiedCount
        Else
            share = 0#
        End If
    End If

    OperarioShareForCell = share
End Function
