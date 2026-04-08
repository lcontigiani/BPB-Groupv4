Option Explicit
Dim WshShell, FSO, URL, ChromePath, ChromePath86
Dim ScriptDir, ConfigPath, ConfigFile, EnvUrl, ScriptPath, UncHost

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

ScriptPath = WScript.ScriptFullName
ScriptDir = FSO.GetParentFolderName(ScriptPath)
ConfigPath = FSO.BuildPath(ScriptDir, "dashboard_url.txt")
EnvUrl = Trim(WshShell.ExpandEnvironmentStrings("%BPB_DASHBOARD_URL%"))
UncHost = ExtractUncHost(ScriptPath)

If EnvUrl <> "" And LCase(EnvUrl) <> "%bpb_dashboard_url%" Then
    URL = EnvUrl
ElseIf FSO.FileExists(ConfigPath) Then
    Set ConfigFile = FSO.OpenTextFile(ConfigPath, 1)
    URL = Trim(ConfigFile.ReadAll)
    ConfigFile.Close
ElseIf UncHost <> "" Then
    URL = "http://" & UncHost & ":5000/"
Else
    URL = "http://127.0.0.1:5000/"
End If

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

Function ExtractUncHost(ByVal FullPath)
    Dim trimmedPath, parts
    ExtractUncHost = ""
    If Left(FullPath, 2) <> "\\" Then
        Exit Function
    End If

    trimmedPath = Mid(FullPath, 3)
    parts = Split(trimmedPath, "\")
    If UBound(parts) >= 0 Then
        ExtractUncHost = Trim(parts(0))
    End If
End Function
