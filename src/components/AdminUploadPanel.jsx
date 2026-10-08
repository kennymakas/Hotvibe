import { useRef, useState, useEffect } from "react";
import { Music2, Upload, X, CheckCircle2, Pencil } from "lucide-react";
import HotVibeAPI from "../hotvibe-api";

const categories=["Trending","Lifestyle","Music"];

function getType(file) {
  if(file.type.startsWith("video/")) return "video";
  if(file.type.startsWith("audio/")) return "audio";
  return "image";
}
function makeItem(file) {
  return {id:crypto.randomUUID(),file,type:getType(file),preview:URL.createObjectURL(file),
    caption:file.name.replace(/\.[^/.]+$/,"").replace(/[-_]+/g," ").trim(),category:"Trending",status:"ready",error:""};
}

export default function AdminUploadPanel({onPublish}) {
  const inputRef=useRef(null);
  const [items,setItems]=useState([]);
  const [error,setError]=useState("");
  const [publishing,setPublishing]=useState(false);

  useEffect(()=>()=>items.forEach(i=>URL.revokeObjectURL(i.preview)),[items]);

  const chooseFiles=(fileList)=>{
    setError("");
    const valid=[], skipped=[];
    const videoExt=["mp4","webm","mov","m4v","avi","mkv","3gp","mpeg","mpg","ogv"];
    const audioExt=["mp3","wav","ogg","oga","m4a","aac","flac","opus","wma","aiff","alac"];
    Array.from(fileList||[]).forEach(file=>{
      const ext=file.name.toLowerCase().split(".").pop();
      const ok=file.type.startsWith("image/")||file.type.startsWith("video/")||file.type.startsWith("audio/")||videoExt.includes(ext)||audioExt.includes(ext);
      if(!ok) skipped.push(file.name);
      else if(file.size>50*1024*1024) skipped.push(`${file.name} (over 50 MB)`);
      else valid.push(makeItem(file));
    });
    if(skipped.length) setError(`Skipped: ${skipped.join(", ")}`);
    setItems(cur=>[...cur,...valid]);
    if(inputRef.current) inputRef.current.value="";
  };

  const update=(id,patch)=>setItems(cur=>cur.map(i=>i.id===id?{...i,...patch}:i));
  const remove=(id)=>setItems(cur=>{const x=cur.find(i=>i.id===id);if(x)URL.revokeObjectURL(x.preview);return cur.filter(i=>i.id!==id);});
  const clearAll=()=>{items.forEach(i=>URL.revokeObjectURL(i.preview));setItems([]);setError("");};

  const publishAll=async()=>{
    if(!items.length||publishing)return;
    if(items.some(i=>!i.caption.trim())) return setError("Every selected media item needs a caption.");
    setPublishing(true);setError("");
    let failed=0;
    for(const item of items){
      update(item.id,{status:"uploading",error:""});
      try{
        const saved=await HotVibeAPI.publish(item.file,item.caption.trim(),item.category);
        const post={...saved,title:saved.caption||item.caption.trim(),
          image:saved.type==="image"?saved.mediaUrl:undefined,
          video:saved.type==="video"?saved.mediaUrl:undefined,
          audio:saved.type==="audio"?saved.mediaUrl:undefined,
          tags:saved.category?[`#${saved.category}`]:[],comments:[],
          commentsEnabled:saved.commentsEnabled!==false};
        onPublish(post); update(item.id,{status:"done"});
      }catch(err){failed++;update(item.id,{status:"error",error:err?.message||"Upload failed"});}
    }
    if(!failed)setTimeout(clearAll,600);
    else setError(`${failed} item${failed>1?"s":""} could not be published. Retry them.`);
    setPublishing(false);
  };

  return <section className="admin-upload">
    <div className="admin-heading"><h2><Upload size={17}/> Add Multiple Posts</h2>
      <p>Select several photos/videos at once, edit each caption and category, then publish them together.</p></div>
    <input ref={inputRef} className="upload-file-input" type="file" multiple accept="image/*,video/*,audio/*" onChange={e=>chooseFiles(e.target.files)}/>
    <button type="button" className="upload-dropzone multi-dropzone" onClick={()=>inputRef.current?.click()}>
      <Upload size={25}/><strong>{items.length?"Add more media":"Select multiple media"}</strong><span>Choose several images, videos or audio files</span>
    </button>

    {!!items.length && <>
      <div className="multi-upload-toolbar"><strong>{items.length} selected</strong><button type="button" onClick={clearAll}>Clear all</button></div>
      <div className="multi-upload-list">{items.map(item=><div className={`multi-upload-item ${item.status}`} key={item.id}>
        <div className="multi-preview">
          {item.type==="video"?<video src={item.preview} controls muted playsInline/>:
           item.type==="audio"?<div className="audio-preview"><Music2 size={22}/><audio src={item.preview} controls/></div>:
           <img src={item.preview} alt={item.file.name}/>}
          {item.status==="done"&&<span className="upload-done"><CheckCircle2 size={18}/></span>}
          {item.status==="uploading"&&<span className="upload-state">Uploading…</span>}
        </div>
        <div className="multi-edit">
          <div className="multi-file-name"><Pencil size={13}/> {item.file.name}</div>
          <label className="upload-field"><span>Caption</span>
            <textarea rows="2" value={item.caption} disabled={item.status==="uploading"||item.status==="done"} onChange={e=>update(item.id,{caption:e.target.value})}/>
          </label>
          <label className="upload-field"><span>Category</span>
            <select value={item.category} disabled={item.status==="uploading"||item.status==="done"} onChange={e=>update(item.id,{category:e.target.value})}>
              {categories.map(c=><option key={c}>{c}</option>)}
            </select>
          </label>
          {item.error&&<p className="upload-error">{item.error}</p>}
        </div>
        {item.status!=="uploading"&&item.status!=="done"&&<button type="button" className="multi-remove" onClick={()=>remove(item.id)} aria-label="Remove"><X size={16}/></button>}
      </div>)}</div>
      <button className="publish-button" type="button" disabled={publishing} onClick={publishAll}>
        {publishing?"Publishing selected media…":`Publish ${items.length} media item${items.length>1?"s":""}`}
      </button>
    </>}
    {error&&<p className="upload-error">{error}</p>}
  </section>;
}
