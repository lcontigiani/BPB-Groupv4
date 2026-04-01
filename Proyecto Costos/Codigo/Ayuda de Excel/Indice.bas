Attribute VB_Name = "Indice"
Option Explicit

Public Sub ActualizarIndice()
    Const START_ROW As Long = 6 ' primera fila de datos (N y nombre de hoja)

    Dim idx As Worksheet, sh As Worksheet, f As Range
    Dim r As Long, n As Long, i As Long

    On Error Resume Next
    Set idx = ThisWorkbook.Worksheets("INDICE")
    On Error GoTo 0
    If idx Is Nothing Then
        MsgBox "No se encontró la hoja 'INDICE'.", vbExclamation
        Exit Sub
    End If

    ' Limpiar área de datos sin tocar el formato
    idx.Range("B" & START_ROW & ":D" & idx.Rows.Count).ClearContents
    For i = idx.Hyperlinks.Count To 1 Step -1
        If idx.Hyperlinks(i).Range.Column = 3 And idx.Hyperlinks(i).Range.Row >= START_ROW Then
            idx.Hyperlinks(i).Delete
        End If
    Next i

    n = 1
    For Each sh In ThisWorkbook.Worksheets
        If sh.Visible = xlSheetVisible Then
            If sh.Name <> idx.Name Then
                r = START_ROW + n - 1
                idx.Cells(r, "B").Value = n
                idx.Hyperlinks.Add Anchor:=idx.Cells(r, "C"), Address:="", _
                    SubAddress:="'" & sh.Name & "'!A1", TextToDisplay:=sh.Name

                If InStr(1, sh.Name, "INFO", vbTextCompare) > 0 Then
                    idx.Cells(r, "D").Value = " - "
                Else
                    Set f = sh.Columns("B").Find(What:="APROBADO POR:", LookAt:=xlWhole, _
                        LookIn:=xlValues, MatchCase:=False)
                    If Not f Is Nothing Then
                        Dim targetRow As Long
                        Dim shNameEscaped As String
                        targetRow = f.Row
                        shNameEscaped = Replace(sh.Name, "'", "''") ' escape single quotes in sheet name
                        idx.Cells(r, "D").Formula = "='" & shNameEscaped & "'!L" & targetRow
                    Else
                        idx.Cells(r, "D").Value = " - "
                    End If
                End If
                n = n + 1
            End If
        End If
    Next sh
End Sub
