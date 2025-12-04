import React, {useState, useEffect, useRef} from "react"

export default function Visualizer({array, trace, speed, playing, setPlaying, onComplete}){
  const [display, setDisplay] = useState(array.slice())
  const [highlights, setHighlights] = useState({})
  const [history, setHistory] = useState([array.slice()])
  const [counters, setCounters] = useState({comp:0, swap:0})
  const idxRef = useRef(0)

  useEffect(()=> {
    setDisplay(array.slice())
    setHistory([array.slice()])
    idxRef.current = 0
    setHighlights({})
    setCounters({comp:0, swap:0})
  }, [array])

  useEffect(()=>{
    setDisplay(array.slice())
    setHistory([array.slice()])
    idxRef.current = 0
    setHighlights({})
    setCounters({comp:0, swap:0})
  }, [trace, array])

  useEffect(()=>{
    if(!playing) return
    if(!trace || trace.length===0) return

    const tick = () => {
      const i = idxRef.current
      if(i >= trace.length){
        setPlaying(false)
        if(onComplete) onComplete()
        return
      }
      const action = trace[i]
      applyAction(action, i)
      idxRef.current = i+1
    }

    const id = setInterval(tick, Math.max(10, speed))
    return ()=> clearInterval(id)
  }, [playing, trace, speed, setPlaying, onComplete])

  function applyAction(action, actionIndex=null){
    if(action.type === "compare"){
      setHighlights({compare:[action.i, action.j]})
      setCounters(c => ({...c, comp: c.comp + 1}))
      setHistory(h => {
        const newH = h.slice(0, idxRef.current+1)
        newH.push(display.slice())
        return newH
      })
      return
    }
    if(action.type === "mark"){
      setHighlights({mark:[action.i], tag: action.tag})
      setHistory(h => {
        const newH = h.slice(0, idxRef.current+1)
        newH.push(display.slice())
        return newH
      })
      return
    }
    if(action.type === "swap"){
      setDisplay(prev => {
        const d = prev.slice()
        const tmp = d[action.i]
        d[action.i] = d[action.j]
        d[action.j] = tmp
        setHighlights({swap:[action.i, action.j]})
        setHistory(h => {
          const newH = h.slice(0, idxRef.current+1)
          newH.push(d.slice())
          return newH
        })
        setCounters(c => ({...c, swap: c.swap + 1}))
        return d
      })
      return
    }
    if(action.type === "overwrite"){
      setDisplay(prev => {
        const d = prev.slice()
        d[action.i] = action.value
        setHighlights({overwrite:[action.i]})
        setHistory(h => {
          const newH = h.slice(0, idxRef.current+1)
          newH.push(d.slice())
          return newH
        })
        return d
      })
      return
    }
  }

  function stepForward(){
    if(!trace || trace.length===0) return
    const i = idxRef.current
    if(i >= trace.length) return
    applyAction(trace[i], i)
    idxRef.current = i+1
  }

  function stepBack(){
    if(idxRef.current <= 0) return
    const newIdx = idxRef.current - 1
    idxRef.current = newIdx
    setHistory(h => {
      const clamped = h.slice(0, Math.max(newIdx+1, 1))
      const disp = clamped[clamped.length-1] || array.slice()
      setDisplay(disp.slice())
      const counts = computeCounts(trace, newIdx)
      setCounters(counts)
      setHighlights({})
      return clamped
    })
  }

  function computeCounts(traceArr, uptoActionIndex){
    let comp=0, swap=0
    for(let k=0;k<uptoActionIndex && k < (traceArr?traceArr.length:0); k++){
      const a = traceArr[k]
      if(a.type === "compare") comp++
      if(a.type === "swap") swap++
      if(a.type === "overwrite") swap++
    }
    return {comp, swap}
  }

  // compute largest sorted prefix (0..k-1 are sorted ascending)
  function largestSortedPrefix(arr){
    if(!arr || arr.length===0) return 0
    let k = 1
    for(let i=1;i<arr.length;i++){
      if(arr[i-1] <= arr[i]) k++
      else break
    }
    return k
  }

  const sortedPrefix = largestSortedPrefix(display)

  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", marginTop:18}}>
      <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:8}}>
        <div>Comparisons: <strong>{counters.comp}</strong></div>
        <div>Swaps: <strong>{counters.swap}</strong></div>
        <div>Step: <strong>{idxRef.current}/{trace ? trace.length : 0}</strong></div>
      </div>

      <div style={{display:"flex", gap:4, alignItems:"flex-end", height:300, width:"90%", maxWidth:900}}>
        {display.map((v,idx)=> {
          const h = Math.max(6, v)
          const isSorted = idx < sortedPrefix
          const style = {
            height: `${h}px`,
            width: `${Math.max(6, Math.floor(800/display.length))}px`,
            background: isSorted ? "#10b981" : (highlights.swap && highlights.swap.includes(idx) ? "#ff6b6b" : highlights.compare && highlights.compare.includes(idx) ? "#ffd43b" : highlights.mark && highlights.mark.includes(idx) ? "#6BCBFF" : "#3b82f6"),
            transition: "height 120ms ease, transform 120ms ease"
          }
          return <div key={idx} style={style} />
        })}
      </div>

      <div style={{marginTop:12, display:"flex", gap:8}}>
        <button onClick={()=> setPlaying(p=>!p)}>{playing ? "Pause" : "Play"}</button>
        <button onClick={stepForward}>Step</button>
        <button onClick={stepBack}>Step Back</button>
      </div>
    </div>
  )
}
