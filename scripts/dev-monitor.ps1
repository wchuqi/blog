$port = 5173
$timeout = 60
$ready = $false

for ($i = 1; $i -le $timeout; $i++) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($ready) {
    Start-Process "http://localhost:$port"
} else {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show(
        "开发服务器在 $timeout 秒内未就绪（端口 $port 未监听）。`n请查看 D:\blog\dev.log 排查原因。",
        'blog dev',
        'OK',
        'Error'
    )
}
