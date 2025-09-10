export default function Home(){
  return (
    <>
      <section className="section">
        <div className="container hero">
          <div>
            <h1 className="h1">Fast, fresh & spotless laundry.</h1>
            <p className="p" style={{marginTop:12}}>
              Doorstep pickup & delivery. Same-day options. Trusted by 2,000+ customers.
            </p>
            <div style={{display:"flex", gap:12, marginTop:18, flexWrap:"wrap"}}>
              <a className="btn" href="tel:+91XXXXXXXXXX">Book Pickup</a>
              <a className="btn" href="/pricing" style={{background:"#0ea5e9"}}>See Pricing</a>
            </div>
          </div>

          <div className="hero-blob">
            <img
              src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=1400&auto=format&fit=crop"
              alt="Laundry"
            />
          </div>
        </div>
      </section>

      <section className="section" style={{background:"#f8fafc"}}>
        <div className="container">
          <h2 className="h2" style={{marginBottom:18}}>Why Saka?</h2>
          <div className="grid cols-1 cols-md-2 cols-lg-3">
            {[
              {t:"Express delivery", d:"24–48h turnaround with live tracking."},
              {t:"Gentle care", d:"Fabric-safe detergents & smart sorting."},
              {t:"Transparent pricing", d:"No surprises. Pay per kg or per item."},
            ].map((it,i)=>(
              <div key={i} className="card">
                <h3 style={{margin:"0 0 6px 0"}}>{it.t}</h3>
                <p className="p" style={{margin:0}}>{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
