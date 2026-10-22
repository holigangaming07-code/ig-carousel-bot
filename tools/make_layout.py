import json, os
CY, PK, GR, GD, WH, MU, BL, TE, HP = '#43d9ff', '#d58bff', '#34f0b0', '#ffd34d', '#f3f7ff', '#b9c6e6', '#5aa8ff', '#3fe6d4', '#ff7de0'

def F(x, y, w, h, fs, c=WH, fw=600, al='left', lh=1.15, mn=None, rot=0, **kw):
    d = dict(x=x, y=y, w=w, h=h, fs=fs, mn=mn or round(fs * 0.6), c=c, fw=fw, al=al, lh=lh)
    if rot: d['rot'] = rot
    d.update(kw)
    return d

def legend_panel(centers, x=46, w=212, h=56):
    return [[x, c - h // 2, w, h] for c in centers]

def books(xs, ys, w, rot=-6, fs=21):
    cols = ['#8fd6ff', '#cfa2ff', '#7fe7ff', '#d79bff', '#6ee9ff']
    return {f'cat{i}': F(xs[i], ys[i] - 15, w, 30, fs, cols[i], 800, rot=rot, mn=14, up=1, erase=[xs[i] - 2, ys[i] - 26, w + 8, 52]) for i in range(5)}

S = {}

# 1 kapak
S['rvCover'] = dict(bg=1, legend=legend_panel([620, 683, 746, 808, 871]), f={
    'title': F(80, 112, 715, 118, 120, WH, 800, lh=1.0, mn=52, grad=1),
    'tagline': F(85, 244, 725, 52, 40, WH, 500, mn=24),
    'tail': F(733, 218, 52, 24, 1, WH, 500),
    'stars': F(208, 330, 335, 82, 44, CY, 800, mn=30),
    'forks': F(708, 336, 305, 56, 44, PK, 800, mn=30),
    'repoHead': F(358, 622, 440, 34, 24, WH, 700, mn=16),
    'promise': F(243, 1276, 660, 62, 42, '#e9f7ff', 800, lh=1.05, mn=24),
    **books([218, 226, 233, 236, 236], [995, 1050, 1104, 1160, 1212], 128)})

# 2 ne işe yarar
S['rvExplain'] = dict(bg=2, legend=[[68, 1121, 112, 97], [188, 1121, 112, 97], [309, 1121, 121, 97], [438, 1121, 127, 97], [574, 1121, 120, 97]], f={
    'summary': F(82, 306, 640, 56, 40, WH, 500, mn=24),
    'ctitle': F(252, 402, 790, 46, 36, CY, 800, mn=24),
    'desc': F(252, 452, 790, 86, 28, '#c9d6f2', 500, lh=1.22, mn=18),
    'feat0': F(214, 604, 246, 116, 30, CY, 800, mn=16, c2=MU),
    'feat1': F(731, 604, 246, 116, 30, PK, 800, mn=16, c2=MU),
    'feat2': F(214, 766, 246, 116, 30, GR, 800, mn=16, c2=MU),
    'feat3': F(731, 766, 246, 116, 30, PK, 800, mn=16, c2=MU),
    'extra': F(219, 934, 765, 92, 34, GD, 800, mn=20, c2=MU)})

# 3 kimler için uygun
a3 = {}
for i, (x, y, c) in enumerate([(424, 331, CY), (844, 331, PK), (432, 721, GR), (856, 721, GD)]):
    a3[f'a{i}h'] = F(x, y, 238, 92, 30, c, 800, mn=16, c2=MU)
rows = {0: (360, [497, 558, 618]), 1: (784, [496, 557, 618]), 2: (362, [889, 949, 1004]), 3: (786, [888, 947, 1005])}
for i, (x, ys) in rows.items():
    for j, y in enumerate(ys):
        a3[f'a{i}r{j}'] = F(x, y, 275, 28, 21, WH, 500, mn=13)
S['rvAudience'] = dict(bg=3, legend=legend_panel([618, 681, 743, 806, 868]), f={
    'sub': F(85, 230, 575, 52, 40, WH, 500, mn=24),
    'bottom': F(224, 1286, 715, 54, 38, '#e9f7ff', 800, mn=22),
    **a3, **books([136, 140, 147, 151, 152], [993, 1043, 1090, 1136, 1185], 100, -5, 17)})

# 4 kurulum
S['rvSetup'] = dict(bg=4, legend=legend_panel([619, 682, 744, 806, 869]), f={
    'sub': F(84, 240, 748, 52, 40, WH, 500, mn=24),
    'st0': F(100, 395, 270, 54, 24, CY, 700, 'center', 1.1, mn=14),
    'st1': F(446, 395, 270, 54, 24, PK, 700, 'center', 1.1, mn=14),
    'st2': F(787, 395, 270, 54, 24, TE, 700, 'center', 1.1, mn=14),
    'n0': F(942, 584, 152, 34, 19, WH, 600, 'center', mn=11),
    'n1': F(328, 862, 142, 34, 19, WH, 600, 'center', mn=11),
    'n2': F(960, 863, 135, 34, 19, WH, 600, 'center', mn=11),
    'bottom': F(243, 1276, 650, 60, 40, '#e9f7ff', 800, lh=1.05, mn=22),
    **books([218, 226, 233, 236, 236], [993, 1050, 1104, 1158, 1211], 128)})

# 5 bölümler
s5 = {}
for i, (x, c) in enumerate([(168, BL), (531, PK), (884, GD)]):
    s5[f's{i}h'] = F(x, 360, 208, 82, 28, c, 800, mn=15, c2=MU)
cols5 = [(126, 218, [479, 522, 566, 609]), (493, 205, [480, 524, 567, 611]), (850, 195, [482, 526, 570, 614])]
for i, (x, w, ys) in enumerate(cols5):
    for j, c in enumerate(ys):
        s5[f's{i}i{j}'] = F(x, c - 13, w, 26, 21, WH, 500, mn=12)
S['rvSections'] = dict(bg=5, legend=legend_panel([760, 816, 870, 924, 978], 48, 202, 50), f={
    'sub': F(82, 280, 745, 52, 40, WH, 500, mn=24),
    'note': F(905, 770, 176, 200, 25, '#ffe28a', 700, lh=1.2, mn=14, rot=-8, erase=[897, 757, 196, 232]),
    'bottom': F(254, 1306, 682, 52, 38, '#e9f7ff', 800, mn=20),
    **s5, **books([227, 232, 238, 241, 242], [1055, 1103, 1150, 1196, 1241], 108)})

# 6 kullanım / arama
s6 = {}
for i, c in enumerate([CY, PK, HP]):
    s6[f'st{i}'] = F([196, 544, 879][i], 293, [178, 178, 186][i], 84, 22, c, 700, lh=1.1, mn=13)
for j, c in enumerate([948, 989, 1029, 1069]):
    s6[f'ex{j}'] = F(94, c - 13, 155, 26, 20, WH, 500, mn=12)
tcols = ['#4fb8ff', PK, GR, HP]
for r, (ty, dy, py) in enumerate([(766, 791, 812), (854, 878, 902), (941, 966, 992), (1029, 1054, 1082)]):
    s6[f'res{r}t'] = F(420, ty, 245, 24, 22, tcols[r], 700, mn=13)
    s6[f'res{r}d'] = F(420, dy, 245, 20, 17, MU, 500, mn=11)
    for k, px in enumerate([733, 827, 919]):
        s6[f'res{r}g{k}'] = F(px, py - 9, 62, 18, 14, tcols[r], 600, 'center', mn=9)
S['rvUsage'] = dict(bg=6, legend=legend_panel([609, 663, 719, 774, 831], 46, 212, 52), f={
    'sub': F(82, 218, 712, 52, 40, WH, 500, mn=24),
    'url': F(335, 428, 522, 42, 30, WH, 800, 'center', mn=16),
    'exT': F(84, 888, 175, 30, 21, WH, 700, mn=14),
    'pageTitle': F(332, 598, 322, 30, 21, WH, 700, mn=13),
    'input': F(394, 648, 312, 30, 21, MU, 500, mn=13),
    **s6, **books([220, 228, 236, 238, 240], [1135, 1188, 1238, 1288, 1335], 118)})

# 7 indirme
S['rvDownload'] = dict(bg=7, legend=legend_panel([440, 503, 566, 628, 691], 46, 214, 52), f={
    'sub': F(82, 270, 712, 52, 40, WH, 500, mn=24),
    'cmd': F(372, 458, 640, 150, 26, '#e8f3ff', 600, lh=1.3, mn=14, rot=4, mono=1, erase=[366, 450, 660, 215]),
    'adv0t': F(160, 800, 215, 40, 28, GD, 800, mn=15), 'adv1t': F(524, 800, 200, 40, 28, CY, 800, mn=15), 'adv2t': F(880, 800, 205, 40, 28, PK, 800, mn=15),
    'adv0b': F(55, 872, 322, 100, 23, MU, 500, lh=1.25, mn=14), 'adv1b': F(422, 872, 292, 100, 23, MU, 500, lh=1.25, mn=14), 'adv2b': F(778, 872, 292, 100, 23, MU, 500, lh=1.25, mn=14),
    'altT': F(248, 1030, 620, 40, 32, PK, 800, mn=18), 'altB': F(248, 1080, 620, 96, 24, MU, 500, lh=1.25, mn=14),
    'noteT': F(182, 1232, 780, 40, 32, CY, 800, mn=18), 'noteB': F(182, 1278, 780, 58, 24, MU, 500, lh=1.25, mn=14)})

# 8 kapanış
S['rvFinal'] = dict(bg=8, legend=legend_panel([810, 866, 922, 979, 1036], 868, 212, 50), f={
    'sub': F(75, 230, 435, 52, 40, WH, 500, mn=22),
    **{f'val{i}': F(310, c - 21, 318, 42, 30, WH, 600, mn=14) for i, c in enumerate([352, 421, 491, 561, 631])},
    'repoHead': F(230, 808, 330, 32, 20, WH, 700, mn=13),
    **books([188, 192, 197, 198, 198], [967, 1016, 1064, 1111, 1160], 110, -6, 20)})

# silinecek dikdörtgenler
for k, s in S.items():
    er = []
    for name, f in s['f'].items():
        er.append(f.pop('erase', None) or [f['x'], f['y'], f['w'], f['h']])
    s['erase'] = er
json.dump({'w': 1122, 'h': 1402, 'slides': S}, open(r'C:\ig-carousel-bot\template\rv\layout.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', sum(len(s['erase']) for s in S.values()), 'rect')
