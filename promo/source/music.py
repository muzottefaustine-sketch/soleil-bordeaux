import numpy as np, wave
SR=44100; BPM=120; B=60/BPM; DUR=32.0
N=int(SR*DUR); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def add(sig,t,gain=1.0,pan=0.0):
    i=int(t*SR); j=min(N,i+len(sig)); s=sig[:j-i]*gain
    L[i:j]+=s*(1-pan)*0.5*2**0.5 if False else s*np.sqrt((1-pan)/2); R[i:j]+=s*np.sqrt((1+pan)/2)
def onepole_lp(x,a):
    y=np.empty_like(x); acc=0.0; a=np.broadcast_to(np.asarray(a,float),x.shape)
    for n in range(len(x)): acc+=a[n]*(x[n]-acc); y[n]=acc
    return y
def env(n,a,d):
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-t/d); return e
def kick():
    n=int(0.45*SR); t=np.arange(n)/SR
    f=48+110*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
    return np.tanh(1.6*np.sin(ph)*np.exp(-t*7.5))
def clap():
    n=int(0.25*SR); x=rng.standard_normal(n); x=np.diff(np.concatenate([[0],x]))
    e=np.zeros(n)
    for k,o in enumerate([0,0.011,0.022]): i=int(o*SR); e[i:]+=np.exp(-np.arange(n-i)/SR*(60 if k<2 else 14))
    return x*e*0.5
def hat(open_=False):
    n=int((0.18 if open_ else 0.05)*SR); x=rng.standard_normal(n); x=np.diff(np.diff(np.concatenate([[0,0],x])))
    return x*np.exp(-np.arange(n)/SR*(18 if open_ else 70))*0.25
def note(m): return 440*2**((m-69)/12)
def saw(f,n,det=0.0):
    t=np.arange(n)/SR; out=0
    for d in (-det,0,det): out=out+2*((t*f*(1+d))%1)-1
    return out/3
def chord_stab(ms,n,cut=0.12):
    x=sum(saw(note(m),n,0.004) for m in ms)/len(ms)
    return onepole_lp(x,cut)*env(n,0.004,0.16)
def pad(ms,n,cut):
    x=sum(saw(note(m),n,0.006) for m in ms)/len(ms)
    e=np.minimum(1,np.arange(n)/SR/0.3)*np.minimum(1,(n-np.arange(n))/SR/0.3)
    return onepole_lp(x,cut)*e
# D - A - Bm - G (sunny I-V-vi-IV)
prog=[[62,66,69,73],[61,64,69,71],[59,62,66,69],[59,62,67,71]]
roots=[38,33,35,31]
bars=int(DUR/(4*B))
for bar in range(bars):
    t0=bar*4*B; ch=prog[bar%4]; root=roots[bar%4]
    intro = bar<2; outro = bar>=15
    # pad always
    cut = 0.05+0.03*min(1,bar/2) if bar<3 else 0.08
    add(pad(ch,int(4*B*SR),cut),t0,0.45 if intro else (0.22 if not outro else 0.3))
    # arpeggio pluck (hook)
    if bar<15:
        seq=[ch[0]+12,ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+12,ch[1]+12,ch[2]+12,ch[3]+12]
        for k in range(16):
            n=int(0.2*SR); f=note(seq[k%8]); tt=np.arange(n)/SR
            pl=(np.sin(2*np.pi*f*tt)+0.35*np.sin(4*np.pi*f*tt)+0.12*np.sin(6*np.pi*f*tt))*np.exp(-tt*16)
            add(pl,t0+k*B/4,0.32 if intro else 0.2,0.35 if k%2 else -0.35)
    if outro:
        continue
    for beat in range(4):
        tb=t0+beat*B
        if not intro: add(kick(),tb,0.95)
        if not intro and beat in (1,3): add(clap(),tb,0.55,0.1)
        add(hat(),tb+B/2,0.6 if not intro else 0.35,0.3)
        if not intro: add(hat(),tb+B/4,0.18,-0.3); add(hat(),tb+3*B/4,0.18,-0.3)
        if not intro:
            # offbeat stabs
            add(chord_stab([m+12 for m in ch],int(0.3*SR)),tb+B/2,0.45,-0.15)
            # bass: off-beat pumping
            n=int(0.22*SR); bs=np.sin(2*np.pi*note(root)*np.arange(n)/SR)+0.3*np.sin(4*np.pi*note(root)*np.arange(n)/SR)
            add(bs*env(n,0.005,0.12),tb+B/2,0.55)
    if bar==1:  # riser into drop at 4s
        n=int(4*B*SR); t=np.arange(n)/SR; x=rng.standard_normal(n)
        x=onepole_lp(x,0.02+0.4*(t/t[-1])**2)*(t/t[-1])**2
        add(x,t0,0.5)
        add(np.diff(np.concatenate([[0],x])),t0,0.0)
    if bar in (6,10):  # small fills
        for k in range(4): add(clap(),t0+3*B+k*B/4,0.25+0.1*k)
# crash/impact at drop and end
for tt,g in ((2*4*B,0.7),(15*4*B,0.6)):
    n=int(1.6*SR); x=rng.standard_normal(n); x=np.diff(np.concatenate([[0],x]))
    add(x*np.exp(-np.arange(n)/SR*2.2)*0.3,tt,g)
    add(kick(),tt,1.0)
# sidechain pump on pad/everything subtle
t=np.arange(N)/SR; ph=(t%B)/B; sc=np.where(t>=8*B, 0.55+0.45*np.minimum(1,ph/0.45), 1.0)
L*=sc; R*=sc
# fade out
fo=np.clip((DUR-t)/1.5,0,1); L*=fo; R*=fo
m=max(np.abs(L).max(),np.abs(R).max()); L=np.tanh(1.2*L/m)/np.tanh(1.2)*0.9; R=np.tanh(1.2*R/m)/np.tanh(1.2)*0.9
d=(np.stack([L,R],1)*32767).astype('<i2')
with wave.open('music.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
print('ok')
