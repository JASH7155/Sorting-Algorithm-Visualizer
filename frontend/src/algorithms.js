// algorithms.js
// 5 trace generators (unchanged) + small helpers to compute stats in-browser

export function bubbleTrace(a){
  const arr = a.slice()
  const trace = []
  const n = arr.length
  for(let i=0;i<n-1;i++){
    for(let j=0;j<n-1-i;j++){
      trace.push({type:"compare", i:j, j:j+1})
      if(arr[j] > arr[j+1]){
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]]
        trace.push({type:"swap", i:j, j:j+1})
      }
    }
  }
  return trace
}

export function selectionTrace(a){
  const arr = a.slice()
  const trace = []
  const n = arr.length
  for(let i=0;i<n-1;i++){
    let minIdx = i
    for(let j=i+1;j<n;j++){
      trace.push({type:"compare", i:j, j:minIdx})
      if(arr[j] < arr[minIdx]) minIdx = j
    }
    if(minIdx !== i){
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
      trace.push({type:"swap", i:i, j:minIdx})
    }
  }
  return trace
}

export function mergeTrace(a){
  const arr = a.slice()
  const trace = []
  function merge(l,r,start){
    const res = []
    let i=0,j=0
    while(i<l.length && j<r.length){
      trace.push({type:"compare", i:start+i, j:start+l.length+j})
      if(l[i] <= r[j]) res.push(l[i++])
      else res.push(r[j++])
    }
    while(i<l.length) res.push(l[i++])
    while(j<r.length) res.push(r[j++])
    for(let k=0;k<res.length;k++){
      trace.push({type:"overwrite", i:start+k, value:res[k]})
    }
    return res
  }
  function ms(arr_, start){
    if(arr_.length<=1) return arr_.slice()
    const mid = Math.floor(arr_.length/2)
    const left = ms(arr_.slice(0,mid), start)
    const right = ms(arr_.slice(mid), start+mid)
    return merge(left,right,start)
  }
  ms(arr,0)
  return trace
}

export function quickTrace(a){
  const arr = a.slice()
  const trace = []
  function partition(l,r){
    const pivot = arr[r]
    trace.push({type:"mark", i:r, tag:"pivot"})
    let i = l-1
    for(let j=l;j<r;j++){
      trace.push({type:"compare", i:j, j:r})
      if(arr[j] < pivot){
        i++
        [arr[i], arr[j]] = [arr[j], arr[i]]
        trace.push({type:"swap", i:i, j:j})
      }
    }
    [arr[i+1], arr[r]] = [arr[r], arr[i+1]]
    trace.push({type:"swap", i:i+1, j:r})
    return i+1
  }
  function qs(l,r){
    if(l<r){
      const p = partition(l,r)
      qs(l,p-1)
      qs(p+1,r)
    }
  }
  qs(0,arr.length-1)
  return trace
}

export function heapTrace(a){
  const arr = a.slice()
  const trace = []
  const n = arr.length
  function heapify(size,i){
    let largest = i
    const l = 2*i+1
    const r = 2*i+2
    if(l < size){
      trace.push({type:"compare", i:l, j:largest})
      if(arr[l] > arr[largest]) largest = l
    }
    if(r < size){
      trace.push({type:"compare", i:r, j:largest})
      if(arr[r] > arr[largest]) largest = r
    }
    if(largest !== i){
      [arr[i], arr[largest]] = [arr[largest], arr[i]]
      trace.push({type:"swap", i:i, j:largest})
      heapify(size, largest)
    }
  }
  for(let i=Math.floor(n/2)-1;i>=0;i--) heapify(n,i)
  for(let end=n-1;end>0;end--){
    [arr[0], arr[end]] = [arr[end], arr[0]]
    trace.push({type:"swap", i:0, j:end})
    heapify(end,0)
  }
  return trace
}

export const algorithms = {
  bubble: bubbleTrace,
  selection: selectionTrace,
  merge: mergeTrace,
  quick: quickTrace,
  heap: heapTrace
}

// ---------- helpers for frontend stats ----------

// count comps/swaps/overwrites from a trace
export function statsFromTrace(trace){
  let comps = 0, swaps = 0, overwrites = 0
  for(const a of trace){
    if(a.type === "compare") comps++
    if(a.type === "swap") swaps++
    if(a.type === "overwrite") overwrites++
  }
  return {comps, swaps, overwrites, length: trace.length}
}

// run all algorithms on given array and return measured metrics (ms via performance.now)
export function runAllStats(arr){
  const results = {}
  for(const [name, fn] of Object.entries(algorithms)){
    const start = performance.now()
    const trace = fn(arr.slice())
    const end = performance.now()
    const stats = statsFromTrace(trace)
    results[name] = {timeMs: end - start, comps: stats.comps, swaps: stats.swaps + stats.overwrites, traceLength: stats.length}
  }
  return results
}
