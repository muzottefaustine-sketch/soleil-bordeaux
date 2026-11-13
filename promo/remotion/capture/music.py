import numpy as np, wave
SR=44100; BPM=120; B=60/BPM; DUR=38.0
N=int(SR*DUR); L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(3)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); j=min(N,i+len(sig));
    if j<=i: return
    s=sig[:j-i]*g; L[i:j]+=s*np.sqrt((1-pan)/2); R[i:j]+=s*np.sqrt((1+pan)/2)
def lp(x,a):
    y=np.empty_like(x); acc=0.0; a=np.broadcast_to(np.asarray(a,float),x.shape)
    for n in range(len(x)): acc+=a[n]*(x[n]-acc); y[n]=acc
    return y
note=lambda m:440*2**((m-69)/12)
def kick():
    n=int(0.4*SR); t=np.arange(n)/SR; f=45+70*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def hat():
    n=int(0.04*SR); x=np.diff(np.diff(np.concatenate([[0,0],rng.standard_normal(n)])))
    return x*np.exp(-np.arange(n)/SR*90)*0.12
def rim():
    n=int(0.08*SR); t=np.arange(n)/SR
    return (np.sin(2*np.pi*1700*t)*0.5+rng.standard_normal(n)*0.3)*np.exp(-t*60)*0.4
def pad(ms,n,cut):
    t=np.arange(n)/SR; x=0
    for m in ms:
        for d in (-0.003,0.003): x=x+np.sin(2*np.pi*note(m)*(1+d)*t)+0.25*np.sin(4*np.pi*note(m)*(1+d)*t)
    e=np.minimum(1,t/0.8)*np.minimum(1,(n/SR-t)/0.8)
    return x/len(ms)*e
def pluck(m,dur=0.5):
    n=int(dur*SR); t=np.arange(n)/SR; f=note(m)
    return (np.sin(2*np.pi*f*t)+0.3*np.sin(4*np.pi*f*t)+0.1*np.sin(6*np.pi*f*t))*np.exp(-t*7)
# Fmaj7 - Am7 - Dm9 - Bbmaj7 (calm, airy)
prog=[[53,57,60,64],[57,60,64,67],[50,53,57,60,64],[46,50,53,57]]
roots=[41,45,38,34]
bars=int(DUR/(4*B))
for bar in range(bars):
    t0=bar*4*B; ch=prog[bar%4]; r=roots[bar%4]
    add(pad([m+12 for m in ch],int(4*B*SR)+int(0.8*SR),0),t0,0.32)
    beatsOn = 2<=bar<bars-1
    seq=[ch[0]+24,ch[2]+24,ch[1]+24,ch[3]+24,ch[2]+24,ch[1]+24,ch[3]+24,ch[2]+24]
    for k in range(8):
        add(pluck(seq[k]),t0+k*B/2,0.16 if bar>=1 else 0.11*(k/8+bar),0.4 if k%2 else -0.4)
        # echo
        add(pluck(seq[k]),t0+k*B/2+0.75*B,0.05,-0.4 if k%2 else 0.4)
    if beatsOn:
        for b in range(4):
            tb=t0+b*B; add(kick(),tb,0.55); add(hat(),tb+B/2,1.0,0.25)
            if b in (1,3) and bar>=4: add(rim(),tb,0.6,-0.2)
        n=int(4*B*SR); tt=np.arange(n)/SR
        add(np.sin(2*np.pi*note(r)*tt)*np.minimum(1,tt/0.05)*np.minimum(1,(4*B-tt)/0.1),t0,0.22)
# soft swell into 3D reveal at 6s
n=int(2*SR); t=np.arange(n)/SR; x=lp(rng.standard_normal(n),0.01+0.1*(t/2)**2)*(t/2)**2
add(x,2.0,0.5)
t=np.arange(N)/SR
fi=np.clip(t/0.6,0,1); fo=np.clip((DUR-t)/2.5,0,1); L*=fi*fo; R*=fi*fo
m=max(abs(L).max(),abs(R).max()); L=np.tanh(1.1*L/m)/np.tanh(1.1)*0.85; R=np.tanh(1.1*R/m)/np.tanh(1.1)*0.85
d=(np.stack([L,R],1)*32767).astype('<i2')
with wave.open('music4.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
print('ok')
