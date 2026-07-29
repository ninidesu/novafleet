import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "./Input.jsx";
import NotificationMenu from "./NotificationMenu.jsx";
import { MENU } from "../glyphs.js";

function SearchIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>}
function LiveClock(){
 const[now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1000);return()=>window.clearInterval(timer);},[]);
 const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 const time=new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(now);
 const date=new Intl.DateTimeFormat(undefined,{month:"short",day:"2-digit",year:"numeric"}).format(now);
 return <div className="topbar-clock" role="timer" aria-label={`${date}, ${time}, ${timezone}`}><strong>{time}</strong><span>{date} · {timezone}</span></div>;
}


const sections=[
 {prefix:"/dashboard",title:"Dashboard",category:"Overview"},
 {prefix:"/live-fleet",title:"Live Map",category:"Fleet Operations"},
 {prefix:"/vehicles",title:"Vehicles",category:"Fleet Operations"},
 {prefix:"/drivers",title:"Drivers",category:"Fleet Operations"},
 {prefix:"/trips",title:"Trips and Routes",category:"Fleet Operations"},
 {prefix:"/route-risk-monitoring",title:"Route & Risk Monitoring",category:"Monitoring"},
 {prefix:"/devices",title:"IoT Devices",category:"Monitoring"},
 {prefix:"/maintenance",title:"Maintenance",category:"Management"},
 {prefix:"/reports",title:"Reports",category:"Management"},
 {prefix:"/settings",title:"Settings",category:"System"},
];
function pageContext(pathname){
 if(pathname==="/trips/new")return{title:"Create Trip",category:"Trips and Routes"};
 if(/^\/trips\/[^/]+\/edit$/.test(pathname))return{title:"Edit Trip",category:"Trips and Routes"};
 if(/^\/trips\/[^/]+$/.test(pathname))return{title:"Trip Details",category:"Trips and Routes"};
 return sections.find(section=>pathname===section.prefix||pathname.startsWith(`${section.prefix}/`))||{title:"NovaFleet",category:"Fleet Operations"};
}

export default function Topbar({user,onMenu,searchQuery,onSearchChange}){
 const {pathname}=useLocation();
 const navigate=useNavigate();
 const inputRef=useRef(null);
 const [focused,setFocused]=useState(false);
 const context=pageContext(pathname);
 const statusLabel=user?.role==="dispatcher"?"Live operations":"Systems operational";
 const suggestions=useMemo(()=>{
  const term=searchQuery.trim().toLowerCase();
  if(!term)return[];
  return sections.filter(section=>`${section.title} ${section.category}`.toLowerCase().includes(term)).slice(0,5);
 },[searchQuery]);

 useEffect(()=>{
  const handleShortcut=(event)=>{
   if(event.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){event.preventDefault();inputRef.current?.focus();}
   if(event.key==="Escape"&&document.activeElement===inputRef.current){onSearchChange("");inputRef.current.blur();}
  };
  window.addEventListener("keydown",handleShortcut);
  return()=>window.removeEventListener("keydown",handleShortcut);
 },[onSearchChange]);

 const openSection=(path)=>{onSearchChange("");setFocused(false);navigate(path);};
 const submit=(event)=>{event.preventDefault();if(suggestions[0])openSection(suggestions[0].prefix);};

 return <header className="topbar">
  <div className="topbar-context"><button className="mobile-menu-button" type="button" onClick={onMenu} aria-label="Open navigation">{MENU}</button><div className="topbar-workspace"><span className="topbar-kicker">{context.category}</span><h1>{context.title}</h1></div><div className="topbar-live-status" role="status"><span aria-hidden="true"/>{statusLabel}</div></div>
  <div className="topbar-actions">
   <form className="topbar-search-shell" role="search" onSubmit={submit}>
    <div className="topbar-search"><SearchIcon/><Input ref={inputRef} id="global-search" placeholder={`Search ${context.title.toLowerCase()}`} aria-label={`Search ${context.title}`} value={searchQuery} onChange={(event)=>onSearchChange(event.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>window.setTimeout(()=>setFocused(false),120)}/>{searchQuery?<button className="topbar-search-clear" type="button" onClick={()=>onSearchChange("")} aria-label="Clear search">{"\u00D7"}</button>:<kbd>/</kbd>}</div>
    {focused&&suggestions.length>0&&<div className="topbar-search-results" role="listbox" aria-label="Matching modules">{suggestions.map(section=><button type="button" role="option" key={section.prefix} onMouseDown={(event)=>event.preventDefault()} onClick={()=>openSection(section.prefix)}><span>{section.title}</span><small>{section.category}</small></button>)}</div>}
   </form>
   <LiveClock/><NotificationMenu/><div className="topbar-divider" aria-hidden="true"/><button className="topbar-user" type="button" onClick={() => navigate("/settings")} aria-label={`Open settings for ${user?.name}`}><div className="topbar-avatar" aria-hidden="true">{user?.initials}</div><div className="topbar-user-copy"><strong>{user?.name}</strong><span>{user?.roleLabel}</span></div></button>
  </div>
 </header>;
}
