Attribute VB_Name = "Producto"

Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"

Attribute VB_GlobalNameSpace = False

Attribute VB_Creatable = False

Attribute VB_PredeclaredId = True

Attribute VB_Exposed = True

Attribute VB_TemplateDerived = False

Attribute VB_Customizable = True

Option Explicit







' ==== CONFIGURACION DEL MULTI-SELECT ====



Private Const MULTI_RANGE As String = "D9:D100"



Private Const sep As String = " - "







' Estado previo del toggle



Private OldValue As String



Private OldAddr As String







' Para control de cambios reales (firma)



Private valorAnterior As Variant

' Historial de valores previos por celda del multi (para no perderlos al salir)

Private prevValores As Object







' Bandera para limitar insercion solo tras cambio en C3



Private allowInsert As Boolean







' =====================================================



' SELECTIONCHANGE ? multi-select + valor previo firma



' =====================================================



Private Sub Worksheet_SelectionChange(ByVal Target As Range)



    If prevValores Is Nothing Then Set prevValores = CreateObject("Scripting.Dictionary")

    On Error GoTo salir







    ' Guardamos valor anterior para control de firma



    If Target.CountLarge = 1 Then



        valorAnterior = Target.Value



    Else



        valorAnterior = vbNullString



    End If







    ' Multi-select: guardamos OldValue/OldAddr si la celda esta en el rango



    Dim zona As Range



    Set zona = Intersect(Target, Me.Range(MULTI_RANGE))



    If zona Is Nothing Then



        OldValue = vbNullString



        OldAddr = vbNullString



    Else



        OldValue = CStr(Target.Value)



        OldAddr = Target.Address(False, False)

        If Target.CountLarge = 1 Then

            If HasValidationList(Target) And FilaHabilitadaMulti(Target.Row) Then

                prevValores(Target.Address(False, False)) = Target.Value

            End If

        End If



    End If







    ' Evitar mensajes si la hoja no esta protegida



    If Not Me.ProtectContents Then Exit Sub







    ' Si la celda esta bloqueada avisar y mover el cursor



    If Target.CountLarge = 1 Then



        If Target.Locked Then



            Application.EnableEvents = False



            MsgBox "Esta celda esta protegida y no puede modificarse.", vbExclamation



            Me.Range("A1").Select



            Application.EnableEvents = True



        End If



    End If







salir:



    Application.EnableEvents = True



End Sub







' =====================================================



' NUEVO PROCESO AL CAMBIAR C3: CONTAR MP Y CREAR FILAS



' =====================================================



Private Sub ProcesarCambioC3()



    Dim codigo As String



    codigo = Trim$(CStr(Me.Range("C3").Value))







    If Len(codigo) = 0 Then Exit Sub







    Dim cantidadMP As Long



    Dim codigoCoinc As String



    cantidadMP = ContarMateriasPrimas(codigo, codigoCoinc)







    If cantidadMP = 0 Then



        MsgBox "No se encontraron coincidencias para el codigo: " & codigo, vbInformation, "Sin resultados"



        Exit Sub



    End If







    Dim resp As VbMsgBoxResult



    resp = MsgBox("Pieza encontrada." & vbCrLf & vbCrLf & _
                  "Codigo: " & codigoCoinc & vbCrLf & _
                  "Materias Primas: " & cantidadMP, _
                  vbQuestion + vbOKCancel, "Confirmar insercion")







    If resp = vbCancel Then



        Me.Range("C3").ClearContents



        Exit Sub



    End If




    InsertarFilasDesdeFila9 cantidadMP



End Sub







' =====================================================



' CHANGE ? borra firma + multi-select + control allowInsert



' =====================================================



Private Sub Worksheet_Change(ByVal Target As Range)



    On Error GoTo salir







    ' --- Cambio en C3: proceso de armado de filas ---



    If Not Intersect(Target, Me.Range("C3")) Is Nothing Then



        If Len(Trim$(Me.Range("C3").Value)) > 0 Then ProcesarCambioC3



    End If







    ' ============================



    '   A ? CONTROL DE FIRMAS



    ' ============================



    If Not Firmando Then



        If Target.CountLarge = 1 Then



            Dim cambioReal As Boolean







            If IsError(Target.Value) Or IsError(valorAnterior) Then



                If IsError(Target.Value) And IsError(valorAnterior) Then



                    Dim sNew As String, sOld As String



                    On Error Resume Next



                    sNew = Target.Text



                    sOld = CStr(valorAnterior)



                    On Error GoTo 0



                    cambioReal = (sNew <> sOld)



                Else



                    cambioReal = True



                End If



            Else



                cambioReal = (CStr(Target.Value) <> CStr(valorAnterior))



            End If







            If cambioReal Then



                Application.EnableEvents = False



                BorrarFirma Me



                Application.EnableEvents = True



            End If



        End If



    End If







    ' ============================



    '   B ? MULTI-SELECT (antes de usar el valor en H)



    ' ============================



    Dim zona2 As Range



    Set zona2 = Intersect(Target, Me.Range(MULTI_RANGE))



    If Not zona2 Is Nothing Then



        If Target.CountLarge > 1 Then GoTo despuesMulti



        If Not HasValidationList(Target) Then GoTo despuesMulti



        If Not FilaHabilitadaMulti(Target.Row) Then GoTo despuesMulti



        Application.EnableEvents = False



        Dim elegido As String



        elegido = Trim$(CStr(Target.Value))



        ' Si el usuario borra la celda, limpiamos y salimos



        If Len(elegido) = 0 Then



            Target.Value = vbNullString



            OldValue = vbNullString



            OldAddr = Target.Address(False, False)



            If prevValores Is Nothing Then Set prevValores = CreateObject("Scripting.Dictionary")



            prevValores(Target.Address(False, False)) = vbNullString



            Application.EnableEvents = True



            GoTo despuesMulti



        End If



        Dim previo As String



        previo = ValorPrevioMulti(Target)



        Target.Value = ToggleValue(previo, elegido, sep)



        OldValue = CStr(Target.Value)



        OldAddr = Target.Address(False, False)



        If prevValores Is Nothing Then Set prevValores = CreateObject("Scripting.Dictionary")



        prevValores(Target.Address(False, False)) = Target.Value



        Application.EnableEvents = True



    End If

despuesMulti:



    ' ============================



    ' ACTUALIZAR COLUMNA H SEGUN COLUMNA D Y ETIQUETA EN COLUMNA B (con valor final)



    ' ============================



salir:



    Application.EnableEvents = True



End Sub







' =====================================================



' CALCULATE ? insercion de filas SOLO SI allowInsert = TRUE



' =====================================================



Private Sub Worksheet_Calculate()



    On Error GoTo salir







    If Not allowInsert Then Exit Sub







    Application.EnableEvents = False







    If RangTieneDatos(Me.Range("D12:E12")) Then



        InsertarFilaNueva 13



    End If







    If RangTieneDatos(Me.Range("D13:E13")) Then



        InsertarFilaNueva 14



    End If







    allowInsert = False







salir:



    Application.EnableEvents = True



End Sub







' =====================================================



' FUNCIONES AUXILIARES



' =====================================================



Private Function RangTieneDatos(r As Range) As Boolean



    RangTieneDatos = (Application.WorksheetFunction.CountA(r) > 0)



End Function







Private Sub InsertarFilaNueva(ByVal fila As Long)



    Me.Rows(fila).Insert Shift:=xlDown



    Me.Rows(10).Copy



    Me.Rows(fila).PasteSpecial xlPasteAll



    Application.CutCopyMode = False



End Sub







Private Function HasValidationList(r As Range) As Boolean



    On Error Resume Next



    HasValidationList = (r.Validation.Type = xlValidateList)



    On Error GoTo 0



End Function







Private Function ToggleValue(previo As String, elegido As String, delim As String) As String



    Dim arr() As String, i As Long



    Dim tmp As String, existe As Boolean







    elegido = Trim$(elegido)







    If Len(elegido) = 0 Then



        ToggleValue = previo



        Exit Function



    End If







    If Len(Trim$(previo)) = 0 Then



        ToggleValue = elegido



        Exit Function



    End If







    arr = Split(previo, delim)







    For i = LBound(arr) To UBound(arr)



        If Trim$(arr(i)) = elegido Then existe = True



    Next i







    If existe Then



        For i = LBound(arr) To UBound(arr)



            Dim cur As String



            cur = Trim$(arr(i))



            If cur <> elegido And Len(cur) > 0 Then



                If Len(tmp) > 0 Then tmp = tmp & delim



                tmp = tmp & cur



            End If



        Next i



        ToggleValue = tmp



    Else



        ToggleValue = previo & delim & elegido



    End If



End Function







' =====================================================



' NUEVA SUB: ACTUALIZAR H14 DESDE LIBRO EXTERNO



' =====================================================









' =====================================================



' ACTUALIZAR FILA SEGUN ETIQUETA EN COL B Y ESCRIBIR EN H



' =====================================================



Private Sub ActualizarFilaPorEtiqueta(ByVal fila As Long)

    ' Sin acción: H se calcula por fórmula en la hoja.

End Sub







Private Function EtiquetaParaFila(ws As Worksheet, ByVal fila As Long) As String



    Dim r As Long



    For r = fila To 1 Step -1



        If Len(Trim$(CStr(ws.Cells(r, "B").Value))) > 0 Then



            EtiquetaParaFila = NormalizaTexto(ws.Cells(r, "B").Value)



            Exit Function



        End If



    Next r



    EtiquetaParaFila = ""



End Function







Private Function RutaOffsetPorEtiqueta(etiqueta As String, ByRef ruta As String, ByRef offsetL As Long) As Boolean



    Dim t As String



    t = NormalizaTexto(etiqueta)



    Select Case t



        Case "produccion"



            ruta = "\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Procesos\Analisis de Costos Produccion\Analisis de Costos Produccion.xlsm"



            offsetL = 0



        Case "ensamble"



            ruta = "\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Procesos\Analisis de Costos Ensamble\Analisis de Costos Ensamble.xlsm"



            offsetL = 1



        Case "embalaje"



            ruta = "\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Procesos\Analisis de Costos Embalaje\Analisis de Costos Embalaje.xlsm"



            offsetL = 0



        Case "deposito y logistica"



            ruta = "\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Procesos\Analisis de Costos Deposito y Logistica\Analisis de Costos Deposito y Logistica.xlsm"



            offsetL = 1



        Case Else



            RutaOffsetPorEtiqueta = False



            Exit Function



    End Select



    RutaOffsetPorEtiqueta = True



End Function







Private Function OpcionValidaC(val As Variant) As Boolean



    Dim t As String



    t = NormalizaTexto(val)



    Select Case t



        Case "maquina", "maquina / proceso", "proceso / maquina", "proceso"



            OpcionValidaC = True



        Case Else



            OpcionValidaC = False



    End Select



End Function







Private Function NormalizaTexto(val As Variant) As String



    Dim t As String



    t = LCase(Trim$(CStr(val)))



    t = Replace(t, ChrW(&HE1), "a")



    t = Replace(t, ChrW(&HE9), "e")



    t = Replace(t, ChrW(&HED), "i")



    t = Replace(t, ChrW(&HF3), "o")



    t = Replace(t, ChrW(&HF4), "o")



    t = Replace(t, ChrW(&HF6), "o")



    t = Replace(t, ChrW(&HF5), "o")



    t = Replace(t, ChrW(&HFA), "u")



    t = Replace(t, ChrW(&HFC), "u")



    t = Replace(t, ChrW(&HF1), "n")



    NormalizaTexto = t



End Function







' =====================================================



' CONTAR MP EN EXTERNO Y CREAR FILAS DESDE FILA 9



' =====================================================



Private Function ContarMateriasPrimas(codigo As String, ByRef codigoCoinc As String) As Long


    Dim ruta As String



    ruta = "\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Producto\Auxiliares\TC Formulas de Produccion.xlsx"







    Dim wb As Workbook, ws As Worksheet



    Dim lastRow As Long, i As Long



    Dim codigoFila As String, fechaVal As Double
    Dim codigoFilaNorm As String, codigoBuscar As String
    Dim matchPos As Long
    Dim esCoincidencia As Boolean
    Dim nextChar As String
    Dim prevChar As String

    Dim maxFecha As Double, conteo As Long



    maxFecha = 0
    conteo = 0


    codigoCoinc = ""






    On Error GoTo salir







    Application.AskToUpdateLinks = False



    Application.DisplayAlerts = False



    Set wb = Workbooks.Open(ruta, ReadOnly:=True, UpdateLinks:=False)



    Set ws = wb.Worksheets("Datos")
    codigoBuscar = UCase$(NormalizaTexto(Trim$(codigo)))






    lastRow = ws.Cells(ws.Rows.Count, "C").End(xlUp).Row

    For i = 3 To lastRow

        codigoFila = CStr(ws.Cells(i, "C").Value)

        codigoFilaNorm = UCase$(NormalizaTexto(Trim$(codigoFila)))
        esCoincidencia = False

        ' Coincide solo si el código de la fila termina exactamente con el buscado (permite prefijos, bloquea sufijos como "T")
        esCoincidencia = False
        If Len(codigoFilaNorm) >= Len(codigoBuscar) Then
            If Right$(codigoFilaNorm, Len(codigoBuscar)) = codigoBuscar Then
                esCoincidencia = True
            End If
        End If

        If esCoincidencia Then

             If IsDate(ws.Cells(i, "F").Value) Or IsNumeric(ws.Cells(i, "F").Value) Then

                 fechaVal = CDbl(ws.Cells(i, "F").Value)


                If fechaVal > maxFecha Then



                    maxFecha = fechaVal



                    conteo = 1



                    codigoCoinc = codigoFila



                ElseIf fechaVal = maxFecha Then



                    conteo = conteo + 1



                    If Len(codigoCoinc) = 0 Then codigoCoinc = codigoFila


                End If

             End If

         End If

     Next i






salir:



    On Error Resume Next



    If Not wb Is Nothing Then wb.Close SaveChanges:=False



    Application.AskToUpdateLinks = True



    Application.DisplayAlerts = True







    ContarMateriasPrimas = conteo



End Function







Private Sub InsertarFilasDesdeFila9(ByVal cantidad As Long)



    If cantidad < 1 Then Exit Sub







    Dim extra As Long



    extra = cantidad - 1







    Application.EnableEvents = False



    Application.ScreenUpdating = False







    If extra > 0 Then



        Dim i As Long



        For i = 1 To extra



            Me.Rows(10).Insert Shift:=xlDown, CopyOrigin:=xlFormatFromLeftOrAbove



        Next i



    End If







    Dim src As Range, dest As Range



    Set src = Me.Range("D9:M9")



    Set dest = Me.Range("D9:M" & 9 + cantidad - 1)



    src.Copy



    dest.PasteSpecial xlPasteAll



    Application.CutCopyMode = False







    Dim destRow As Long



    For destRow = 9 To 9 + cantidad - 1



        On Error Resume Next



        Me.Range("D" & destRow & ":E" & destRow).Merge



        Me.Range("K" & destRow & ":L" & destRow).Merge



        On Error GoTo 0



        If destRow = 9 Then



            ' conservar borde original



        Else



            With Me.Range("D" & destRow & ":M" & destRow).Borders(xlEdgeTop)



                .LineStyle = xlContinuous



                .Weight = xlThin



            End With



        End If



    Next destRow







    Application.ScreenUpdating = True



    Application.EnableEvents = True



End Sub







' =====================================================



' RESETEAR BLOQUE DE MATERIAS PRIMAS A SOLO FILAS 9 Y 10



' =====================================================



Private Sub ResetBloqueMateriasPrima()



    Me.Range("D9:M9").Copy



    Me.Range("D10:M10").PasteSpecial xlPasteAll



    Application.CutCopyMode = False



    Me.Cells(10, "B").ClearContents



    Me.Cells(10, "C").ClearContents







    On Error Resume Next



    Me.Range("D9:E9").Merge



    Me.Range("K9:L9").Merge



    Me.Range("D10:E10").Merge



    Me.Range("K10:L10").Merge



    On Error GoTo 0







    With Me.Range("D10:M10").Borders(xlEdgeTop)



        .LineStyle = xlContinuous



        .Weight = xlThin



    End With



End Sub











Private Function FilaHabilitadaMulti(ByVal fila As Long) As Boolean

    Dim t As String

    t = NormalizaTexto(Me.Cells(fila, "C").Value)

    Dim tCompact As String

    tCompact = Replace(t, " ", "")

    Select Case True

        Case t = "maquina", t = "proceso", tCompact = "maquina/proceso", tCompact = "proceso/maquina"

            FilaHabilitadaMulti = True

        Case Else

            FilaHabilitadaMulti = False

    End Select

End Function

Private Function ValorPrevioMulti(rng As Range) As String

    If prevValores Is Nothing Then Set prevValores = CreateObject("Scripting.Dictionary")

    Dim key As String

    key = rng.Address(False, False)

    If prevValores.Exists(key) Then

        ValorPrevioMulti = Trim$(CStr(prevValores(key)))

    Else

        ValorPrevioMulti = Trim$(CStr(rng.Value))

    End If

End Function
