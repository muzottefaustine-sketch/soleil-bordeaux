# Whoosh + thump at each scene cut, mixed under the music (python3 sfx.py in.mp3 out.mp3)
import numpy as np, subprocess, sys, wave
SR=44100; N=40*SR; rng=np.random.default_rng(3)
cuts=[7.6,14.0,18.0,22.0,26.0,29.6,34.8,1.55]
y=np.zeros(N)
def add(sig,t):
    i=int(t*SR); y[i:i+len(sig)]+=sig[:N-i]
for c in cuts:
    L=int(.42*SR); x=np.linspace(0,1,L)
    n=rng.standard_normal(L); # rising filtered noise
    f=np.cumsum(n); lp=np.convolve(n,np.ones(24)/24,'same'); hp=n-lp
    w=(0.55*lp+0.45*hp)*(x**2.2)*np.exp(-((1-x)*0)) 
    add(w*0.35,c-.40)
    L=int(.5*SR); tt=np.arange(L)/SR
    th=np.sin(2*np.pi*(55+90*np.exp(-tt*14))*tt)*np.exp(-tt*7)
    add(th*0.9,c-.02)
# soft ticks on filter changes
for t0 in [18.4,19.65,20.9]:
    tt=np.arange(int(.12*SR))/SR; add(np.sin(2*np.pi*1500*tt)*np.exp(-tt*40)*.18,t0)
y/= max(1e-9,np.abs(y).max()); y*=0.8
with wave.open('/tmp/sfx.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',sys.argv[1],'-i','/tmp/sfx.wav','-filter_complex','[1:a]volume=0.55[s];[0:a][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95','-b:a','192k',sys.argv[2]],check=True)
