// Controls.js - full replacement with save/load, compare-all, speed presets, download CSV
import React, {useState, useEffect} from "react"
import {algorithms, runAllStats} from "./algorithms"

function applyTraceToArray(initial, trace){
  const a = initial.slice()
  for(const action of trace){
    if(action.type === "swap"){
      const tmp = a[action.i]
      a[action.i] = a[action.j]
      a[action.j] = tmp
    } else if(action.type === "overwrite"){
      a[action.i] = action.value
    }
  }
  return a
}

function makeExplanation(algorithm, features, confidence){
  if(!features) return {summary: "No features available", details: []}
  const f = features
  const lines = []
  if(f.n <= 30) lines.push("Small array (n ≤ 30) — simple algorithms often suffice.")
  if(f.sortedness > 0.8) lines.push("Nearly sorted input — algorithms that exploit partial order are preferred.")
  if(f.sortedness < 0.3) lines.push("Low sortedness — requires robust average-case performance.")
  if(f.unique_ratio < 0.25) lines.push("Many duplicates — stable merge/heap behave predictably.")
  if(f.long_run > 0.5) lines.push("Long runs present — merge/quick can leverage runs efficiently.")
  if(lines.length === 0) lines.push("General-purpose case — choose algorithm with best empirical runtime.")
  const summary = `Model selected ${algorithm} (confidence ${Number(confidence).toFixed(2)}).`
  return {summary, details: lines}
}

export default function Controls({array, setArray, setTrace, setPlaying, setSpeed}){
  const [size, setSize] = useState(array.length)
  const [maxVal, setMaxVal] = useState(100)
  const [recommendation, setRecommendation] = useState(null)
  const [explain, setExplain] = useState(null)
  const [saved, setSaved] = useState([])
  const [compareResults, setCompareResults] = useState(null)
  const backendURL = "http://127.0.0.1:5000"

  useEffect(()=> {
    const s = localStorage.getItem("sv_saved_arrays")
    if(s) setSaved(JSON.parse(s))
  }, [])

  async function askRecommend(){
    try{
      const res = await fetch(backendURL + "/recommend", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({array})
      })
      const data = await res.json()
      setRecommendation(data)
      const expl = makeExplanation(data.algorithm, data.features, data.confidence)
      setExplain(expl)
      alert(`Recommended: ${data.algorithm} (confidence ${Number(data.confidence).toFixed(2)})`)
    }catch(e){
      console.error("Recommend API error", e)
      alert("Failed to reach backend /recommend. Make sure backend is running.")
    }
  }

  function randomize(n=30, max=100){
    const a = Array.from({length:n}, ()=> Math.floor(Math.random()*max)+1)
    setArray(a)
    setSize(n)
  }

  function generateTrace(name){
    if(!name) return
    const fn = algorithms[name]
    if(!fn) return
    const t = fn(array.slice())

    console.log("Generated trace for", name, "length:", t.length, "first actions:", t.slice(0,10))
    const final = applyTraceToArray(array.slice(), t)
    const sorted = array.slice().sort((x,y)=>x-y)
    console.log("final after applying trace:", final.slice(0,50), "expected sorted:", sorted.slice(0,50))

    const ok = final.length === sorted.length && final.every((v,i)=> v === sorted[i])
    if(!ok){
      console.error("Trace verification FAILED for", name)
      alert("Trace verification failed. See console for details.")
    } else {
      console.log("Trace OK for", name)
    }

    setTrace(t)
    setPlaying(false)
  }

  function saveArray(name){
    if(!name) name = `array_${new Date().toISOString().replace(/[:.]/g,"-")}`
    const s = localStorage.getItem("sv_saved_arrays")
    const list = s ? JSON.parse(s) : []
    list.push({name, array})
    localStorage.setItem("sv_saved_arrays", JSON.stringify(list))
    setSaved(list)
    alert("Saved array: " + name)
  }

  function loadArray(item){
    if(!item) return
    setArray(item.array.slice())
    alert("Loaded array: " + item.name)
  }

  function deleteSaved(idx){
    const s = localStorage.getItem("sv_saved_arrays")
    const list = s ? JSON.parse(s) : []
    list.splice(idx,1)
    localStorage.setItem("sv_saved_arrays", JSON.stringify(list))
    setSaved(list)
  }

  function setSpeedPreset(mult){
    // map preset multipliers to ms delay (inverse)
    const base = 200
    const val = Math.max(10, Math.floor(base / mult))
    setSpeed(val)
  }

  function compareAll(){
    const stats = runAllStats(array.slice())
    // stats: name -> {timeMs, comps, swaps, traceLength}
    setCompareResults(stats)
  }

  function downloadCompareCSV(){
    if(!compareResults) { alert("Run Compare All first"); return }
    const rows = []
    rows.push(["algorithm","timeMs","comparisons","swaps","traceLength"])
    for(const [k,v] of Object.entries(compareResults)){
      rows.push([k, v.timeMs.toFixed(2), v.comps, v.swaps, v.traceLength])
    }
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], {type:"text/csv"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "compare_results.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function downloadArrayCSV(){
    const csv = array.join(",")
    const blob = new Blob([csv], {type:"text/csv"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "array.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:12}}>
      <div style={{display:"flex", gap:12, alignItems:"center"}}>
        <label style={{display:"flex", alignItems:"center", gap:6}}>
          Size
          <input
            type="number"
            value={size}
            onChange={(e)=> setSize(Number(e.target.value || 0))}
            onBlur={()=> randomize(Math.max(2, Math.floor(size)), Math.max(10, Math.floor(maxVal)))}
            style={{width:80}}
          />
        </label>

        <button onClick={()=> randomize(size, maxVal)}>Random</button>

        <label style={{display:"flex", alignItems:"center", gap:6}}>
          Speed
          <input type="range" min="10" max="1000" defaultValue={200} onChange={(e)=> setSpeed(Number(e.target.value))}/>
        </label>

        <div style={{display:"flex", gap:6}}>
          <button onClick={()=> setSpeedPreset(0.25)}>0.25x</button>
          <button onClick={()=> setSpeedPreset(0.5)}>0.5x</button>
          <button onClick={()=> setSpeedPreset(1)}>1x</button>
          <button onClick={()=> setSpeedPreset(2)}>2x</button>
          <button onClick={()=> setSpeedPreset(5)}>5x</button>
        </div>

        <select onChange={(e)=> generateTrace(e.target.value)}>
          <option value="">Pick algorithm</option>
          <option value="bubble">Bubble</option>
          <option value="selection">Selection</option>
          <option value="merge">Merge</option>
          <option value="quick">Quick</option>
          <option value="heap">Heap</option>
        </select>

        <button onClick={askRecommend}>Recommend</button>

        <button onClick={compareAll}>Compare All</button>
        <button onClick={downloadCompareCSV}>Download Compare CSV</button>
        <button onClick={downloadArrayCSV}>Download Array CSV</button>

        <button onClick={()=> saveArray()}>Save Array</button>
      </div>

      {/* Recommendation / explanation */}
      {recommendation && explain && (
        <div style={{border:"1px solid #e2e8f0", padding:12, borderRadius:8, display:"flex", gap:20, alignItems:"flex-start", background:"#ffffff", maxWidth:920}}>
          <div style={{minWidth:220}}>
            <div style={{fontSize:16, fontWeight:700, marginBottom:6}}>Recommendation</div>
            <div style={{fontSize:14}}><strong>{recommendation.algorithm}</strong> <span style={{color:"#6b7280"}}>({Number(recommendation.confidence).toFixed(2)})</span></div>
            <div style={{marginTop:8, fontSize:13, color:"#374151"}}>{explain.summary}</div>
          </div>

          <div style={{flex:1}}>
            <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>Key features</div>
            <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
              <div style={{minWidth:140}}>
                <div style={{fontSize:12, color:"#6b7280"}}>n</div>
                <div style={{fontWeight:700}}>{recommendation.features?.n ?? "-"}</div>
              </div>
              <div style={{minWidth:140}}>
                <div style={{fontSize:12, color:"#6b7280"}}>sortedness</div>
                <div style={{fontWeight:700}}>{(recommendation.features?.sortedness ?? 0).toFixed(2)}</div>
              </div>
              <div style={{minWidth:140}}>
                <div style={{fontSize:12, color:"#6b7280"}}>unique_ratio</div>
                <div style={{fontWeight:700}}>{(recommendation.features?.unique_ratio ?? 0).toFixed(2)}</div>
              </div>
              <div style={{minWidth:140}}>
                <div style={{fontSize:12, color:"#6b7280"}}>long_run</div>
                <div style={{fontWeight:700}}>{(recommendation.features?.long_run ?? 0).toFixed(2)}</div>
              </div>
            </div>

            <div style={{marginTop:10}}>
              <div style={{fontSize:13, fontWeight:600, marginBottom:6}}>Why this matters</div>
              <ul style={{margin:0, paddingLeft:18, color:"#374151"}}>
                {explain.details.map((d,i)=> <li key={i} style={{marginBottom:6}}>{d}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* saved arrays */}
      {saved.length > 0 && (
        <div style={{maxWidth:920, border:"1px dashed #e6edf3", padding:10, borderRadius:8}}>
          <div style={{fontWeight:700, marginBottom:8}}>Saved arrays</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {saved.map((it,idx)=> (
              <div key={idx} style={{border:"1px solid #e6edf3", padding:8, borderRadius:6, minWidth:180}}>
                <div style={{fontWeight:600}}>{it.name}</div>
                <div style={{fontSize:12, color:"#6b7280"}}>n = {it.array.length}</div>
                <div style={{marginTop:8, display:"flex", gap:6}}>
                  <button onClick={()=> loadArray(it)}>Load</button>
                  <button onClick={()=> deleteSaved(idx)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* compare results */}
      {compareResults && (
        <div style={{maxWidth:920, border:"1px solid #e2e8f0", padding:10, borderRadius:8}}>
          <div style={{fontWeight:700, marginBottom:8}}>Compare results (frontend measured)</div>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{textAlign:"left"}}>
                <th>Algorithm</th><th>time ms</th><th>comparisons</th><th>swaps</th><th>trace len</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(compareResults).map(([k,v])=> (
                <tr key={k}>
                  <td style={{padding:"6px 8px"}}>{k}</td>
                  <td style={{padding:"6px 8px"}}>{v.timeMs.toFixed(2)}</td>
                  <td style={{padding:"6px 8px"}}>{v.comps}</td>
                  <td style={{padding:"6px 8px"}}>{v.swaps}</td>
                  <td style={{padding:"6px 8px"}}>{v.traceLength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
