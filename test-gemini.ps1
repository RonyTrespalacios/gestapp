# Script de prueba para la API de Gemini en PowerShell

Write-Host "Probando API de Gemini..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    userInput = "ayer gasté 2500 en un helado"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/gemini/parse" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        Write-Host $reader.ReadToEnd()
    }
}

