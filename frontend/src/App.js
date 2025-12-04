import React, {useState} from "react"
import Visualizer from "./Visualizer"
import Controls from "./Controls"
import "./index.css"

export default function App(){
  const [array, setArray] = useState(Array.from({length:30}, ()=>Math.floor(Math.random()*100)+1))
  const [trace, setTrace] = useState([])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(200)

  return (
    <div style={{padding:24, fontFamily:"Arial"}}>
      <h2 style={{margin:0}}>Sorting Visualizer</h2>
      <div style={{marginTop:12}}>
        <Controls
          array={array}
          setArray={setArray}
          setTrace={setTrace}
          setPlaying={setPlaying}
          setSpeed={setSpeed}
        />
      </div>
      <Visualizer
        array={array}
        trace={trace}
        speed={speed}
        playing={playing}
        setPlaying={setPlaying}
      />
    </div>
  )
}
