Option Explicit
Dim WshShell, FSO, URL, ChromePath, ChromePath86

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

URL = "http://192.168.0.13:5000/"
ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
ChromePath86 = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

If FSO.FileExists(ChromePath) Then
    ' Chrome 64-bit found
    WshShell.Run """" & ChromePath & """ " & URL, 1, False
ElseIf FSO.FileExists(ChromePath86) Then
    ' Chrome 32-bit found
    WshShell.Run """" & ChromePath86 & """ " & URL, 1, False
Else
    ' Chrome not found, launch URL default
    WshShell.Run URL, 1, False
End If
