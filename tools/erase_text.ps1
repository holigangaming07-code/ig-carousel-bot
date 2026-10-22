Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class Eraser {
  // dikdörtgenin sol/sağ komşu piksellerinden her satır için doğrusal geçişle doldurur
  public static void Fill(Bitmap bmp, int x, int y, int w, int h, int mode) {
    int W = bmp.Width, H = bmp.Height;
    int x0 = Math.Max(5, x), x1 = Math.Min(W - 6, x + w), y0 = Math.Max(0, y), y1 = Math.Min(H, y + h);
    var rect = new Rectangle(0, 0, W, H);
    var d = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
    int stride = d.Stride;
    byte[] buf = new byte[stride * H];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, buf, 0, buf.Length);
    byte[] orig = (byte[])buf.Clone();
    int ya = Math.Max(5, y0), yb = Math.Min(H - 6, y1);
    // yatay (sol/sağ) ve dikey (üst/alt) kenar uyumsuzluğunu ölç, daha uyumlu olanı seç
    double dh = 0, dv = 0; int nh = 0, nv = 0;
    for (int yy = y0; yy < y1; yy += 2) { int li = yy * stride + (x0 - 2) * 3, ri = yy * stride + (x1 + 2) * 3; for (int c = 0; c < 3; c++) dh += Math.Abs(buf[li + c] - buf[ri + c]); nh++; }
    for (int xx = x0; xx < x1; xx += 2) { int ti = (ya - 2) * stride + xx * 3, bi = (yb + 2) * stride + xx * 3; for (int c = 0; c < 3; c++) dv += Math.Abs(buf[ti + c] - buf[bi + c]); nv++; }
    dh /= Math.Max(1, nh); dv /= Math.Max(1, nv);
    bool horiz = mode == 1 ? true : mode == 2 ? false : (dh <= dv + 6);
    if (horiz) {
      for (int yy = y0; yy < y1; yy++) {
        double lr = 0, lg = 0, lb = 0, rr = 0, rg = 0, rb = 0;
        for (int k = 1; k <= 4; k++) {
          int li = yy * stride + (x0 - k) * 3, ri = yy * stride + (x1 + k) * 3;
          lb += buf[li]; lg += buf[li + 1]; lr += buf[li + 2];
          rb += buf[ri]; rg += buf[ri + 1]; rr += buf[ri + 2];
        }
        lr /= 4; lg /= 4; lb /= 4; rr /= 4; rg /= 4; rb /= 4;
        for (int xx = x0; xx < x1; xx++) {
          double t = (double)(xx - x0) / Math.Max(1, x1 - x0 - 1);
          int i = yy * stride + xx * 3;
          buf[i] = (byte)(lb + (rb - lb) * t); buf[i + 1] = (byte)(lg + (rg - lg) * t); buf[i + 2] = (byte)(lr + (rr - lr) * t);
        }
      }
    } else {
      for (int xx = x0; xx < x1; xx++) {
        double tr = 0, tg = 0, tb = 0, br = 0, bg = 0, bb = 0;
        for (int k = 1; k <= 4; k++) {
          int ti = (ya - k) * stride + xx * 3, bi = (yb + k) * stride + xx * 3;
          tb += buf[ti]; tg += buf[ti + 1]; tr += buf[ti + 2];
          bb += buf[bi]; bg += buf[bi + 1]; br += buf[bi + 2];
        }
        tr /= 4; tg /= 4; tb /= 4; br /= 4; bg /= 4; bb /= 4;
        for (int yy = y0; yy < y1; yy++) {
          double t = (double)(yy - y0) / Math.Max(1, y1 - y0 - 1);
          int i = yy * stride + xx * 3;
          buf[i] = (byte)(tb + (bb - tb) * t); buf[i + 1] = (byte)(tg + (bg - tg) * t); buf[i + 2] = (byte)(tr + (br - tr) * t);
        }
      }
    }
    // kenarları orijinalle yumuşat
    for (int yy = y0; yy < y1; yy++) for (int xx = x0; xx < x1; xx++) {
      int e = Math.Min(Math.Min(xx - x0, x1 - 1 - xx), Math.Min(yy - y0, y1 - 1 - yy));
      if (e >= 7) continue;
      double a = (e + 1) / 8.0; int i = yy * stride + xx * 3;
      for (int c = 0; c < 3; c++) buf[i + c] = (byte)(buf[i + c] * a + orig[i + c] * (1 - a));
    }
    System.Runtime.InteropServices.Marshal.Copy(buf, 0, d.Scan0, buf.Length);
    bmp.UnlockBits(d);
  }
}
'@ -ReferencedAssemblies System.Drawing

$src = 'C:\Users\Muhammet07\Desktop\' + [char]0x015F + 'ablon'
$layout = Get-Content 'C:\ig-carousel-bot\template\rv\layout.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | ? { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 90L
foreach ($p in $layout.slides.PSObject.Properties) {
  $s = $p.Value
  $img = [Drawing.Image]::FromFile("$src\$($s.bg).png")
  $bmp = New-Object Drawing.Bitmap $img.Width, $img.Height, ([Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [Drawing.Graphics]::FromImage($bmp); $g.DrawImage($img, 0, 0, $img.Width, $img.Height); $g.Dispose(); $img.Dispose()
  foreach ($r in $s.erase) { $md = 0; if ($r.Count -gt 4) { $md = [int]$r[4] }; [Eraser]::Fill($bmp, [int]$r[0], [int]$r[1], [int]$r[2], [int]$r[3], $md) }
  $out = "C:\ig-carousel-bot\template\rv\$($s.bg).jpg"
  $bmp.Save($out, $codec, $ep); $bmp.Dispose()
  "{0}: {1} KB" -f $p.Name, [int]((Get-Item $out).Length / 1KB)
}
