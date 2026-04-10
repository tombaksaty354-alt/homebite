"use strict";exports.id=8176,exports.ids=[8176],exports.modules={853:(e,a,t)=>{t.d(a,{Z:()=>o});var s=t(326),i=t(7577),r=t(4690),n=t(4046);let l=["\uD83D\uDC4D","❤️","\uD83D\uDE02","\uD83D\uDE2E","\uD83D\uDE22","\uD83D\uDD25"];function o({partnerId:e,partnerName:a,partnerRole:t,orderId:o,chatType:d,isReadOnly:c=!1,onForwardMessage:m}){let{user:u}=(0,r.a)(),[p,g]=(0,i.useState)([]),[h,x]=(0,i.useState)(""),[b,f]=(0,i.useState)(!1),[_,y]=(0,i.useState)(!1),[v,j]=(0,i.useState)(null),[w,N]=(0,i.useState)(""),[k,D]=(0,i.useState)(!1),[C,S]=(0,i.useState)(!1),[$,E]=(0,i.useState)(!1),[F,M]=(0,i.useState)(!1),[P,U]=(0,i.useState)(0),[I,z]=(0,i.useState)(null),[R,A]=(0,i.useState)(null),[L,G]=(0,i.useState)(null),[V,T]=(0,i.useState)(null),[q,B]=(0,i.useState)(null),[H,O]=(0,i.useState)(null),W=(0,i.useRef)(null),J=(0,i.useRef)(null);(0,i.useRef)(null);let K=(0,i.useRef)(null);(0,i.useRef)([]);let Y=(0,i.useRef)(null);async function Q(a){if(r.supabase&&u)try{let{data:t}=await r.supabase.from("typing_status").select("id").eq("user_id",u.id).eq("conversation_partner_id",e).single();t?await r.supabase.from("typing_status").update({is_typing:a,created_at:new Date().toISOString()}).eq("id",t.id):await r.supabase.from("typing_status").insert({user_id:u.id,conversation_partner_id:e,is_typing:a})}catch(e){console.error("Error updating typing status:",e)}}async function X(){if(!r.supabase||!u||!e){console.log("fetchMessages: Missing dependencies",{supabase:!!r.supabase,user:u?.id,partnerId:e});return}try{console.log("Fetching messages between:",u.id,"and",e,"orderId:",o);let a=r.supabase.from("chat_messages").select("*").or(`sender_id.eq.${u.id},receiver_id.eq.${u.id}`);o&&(a=a.eq("order_id",o));let{data:t,error:s}=await a.order("created_at",{ascending:!0}).limit(500);if(s){console.error("Error fetching messages:",s),console.error("Query details:",{userId:u.id,partnerId:e,orderId:o});return}let i=t?.filter(a=>a.sender_id===u.id&&a.receiver_id===e||a.sender_id===e&&a.receiver_id===u.id)||[];if(console.log("Fetched messages:",i.length,"out of",t?.length||0,"total"),i.length>0){let e=i.filter(e=>e.reply_to_id).map(e=>e.reply_to_id);if(e.length>0){let{data:a}=await r.supabase.from("chat_messages").select("id, pesan, sender_id, attachment_type, voice_duration").in("id",e),{data:t}=await r.supabase.from("users").select("id, nama").in("id",a?.map(e=>e.sender_id)||[]),s={};a?.forEach(e=>{let a=t?.find(a=>a.id===e.sender_id);s[e.id]={id:e.id,pesan:e.pesan,sender_name:a?.nama||"Unknown",attachment_type:e.attachment_type,voice_duration:e.voice_duration}});let n=i.map(e=>({...e,replied_message_preview:e.reply_to_id?s[e.reply_to_id]:void 0}));g(n)}else g(i);let a=i.filter(e=>e.receiver_id===u?.id&&!e.dibaca).map(e=>e.id);a.length>0&&await r.supabase.from("chat_messages").update({dibaca:!0,read_at:new Date().toISOString()}).in("id",a)}else g([]);await Z(),setTimeout(()=>{W.current?.scrollIntoView({behavior:"smooth"})},100)}catch(e){console.error("Error in fetchMessages:",e)}}async function Z(){if(!r.supabase||0===p.length)return;let e=p.map(e=>e.id),{data:a}=await r.supabase.from("message_reactions").select(`
        *,
        users (nama)
      `).in("message_id",e),t={};a?.forEach(e=>{t[e.message_id]||(t[e.message_id]=[]),t[e.message_id].push({id:e.id,message_id:e.message_id,user_id:e.user_id,reaction:e.reaction,user_name:e.users?.nama||"Unknown"})}),g(e=>e.map(e=>({...e,reactions:t[e.id]||[]})))}async function ee(){if(!r.supabase||!u||!h.trim()||!e){console.log("sendMessage: Missing dependencies",{supabase:!!r.supabase,user:u?.id,message:h.trim(),partnerId:e});return}f(!0);try{let a={sender_id:u.id,receiver_id:e,order_id:o||null,chat_type:d||"support",pesan:h,reply_to_id:L?.id||null,dibaca:!1};console.log("Sending message:",a);let{error:t}=await r.supabase.from("chat_messages").insert(a);if(t){console.error("Error sending message:",t),alert(`Gagal mengirim pesan: ${t.message}`);return}console.log("Message sent successfully"),x(""),G(null),Q(!1),X()}catch(e){console.error("Error sending message:",e),alert("Terjadi kesalahan saat mengirim pesan")}finally{f(!1)}}async function ea(e,a){if(r.supabase&&a.trim())try{let{error:t}=await r.supabase.from("chat_messages").update({pesan:a,is_edited:!0,edited_at:new Date().toISOString()}).eq("id",e);t||(A(null),X())}catch(e){console.error("Error editing message:",e)}}async function et(e){if(r.supabase&&confirm("Hapus pesan ini?"))try{let{error:a}=await r.supabase.from("chat_messages").update({is_deleted:!0}).eq("id",e);a||X()}catch(e){console.error("Error deleting message:",e)}}async function es(e,a){if(r.supabase&&u){g(t=>t.map(t=>{if(t.id!==e)return t;let s=t.reactions||[];return s.find(e=>e.reaction===a&&e.user_id===u.id)?t:{...t,reactions:[...s,{id:`temp-${Date.now()}`,message_id:e,user_id:u.id,reaction:a,user_name:u.nama}]}}));try{let{error:t}=await r.supabase.from("message_reactions").insert({message_id:e,user_id:u.id,reaction:a});t&&(console.error("Error adding reaction:",t),await Z())}catch(e){console.error("Error adding reaction:",e),await Z()}T(null)}}async function ei(e,a){if(r.supabase&&u){g(t=>t.map(t=>{if(t.id!==e)return t;let s=(t.reactions||[]).filter(e=>!(e.reaction===a&&e.user_id===u.id));return{...t,reactions:s}}));try{let{error:t}=await r.supabase.from("message_reactions").delete().eq("message_id",e).eq("user_id",u.id).eq("reaction",a);t&&(console.error("Error removing reaction:",t),await Z())}catch(e){console.error("Error removing reaction:",e),await Z()}}}async function er(e){let a;if(!r.supabase||!u)return;let t=p.find(a=>a.id===e);if(!t)return;let s=t.starred_by||[];a=s.includes(u.id)?s.filter(e=>e!==u.id):[...s,u.id],g(t=>t.map(t=>t.id!==e?t:{...t,is_starred:a.length>0,starred_by:a,starred_at:a.length>0?new Date().toISOString():null}));try{let{error:t}=await r.supabase.from("chat_messages").update({is_starred:a.length>0,starred_by:a,starred_at:a.length>0?new Date().toISOString():null}).eq("id",e);t&&(console.error("Error toggling star:",t),await X())}catch(e){console.error("Error toggling star:",e),await X()}B(null)}async function en(e){m&&m(e),B(null)}async function el(){try{let e=await navigator.mediaDevices.getUserMedia({audio:!0}),a=new MediaRecorder(e),t=[];a.ondataavailable=e=>{t.push(e.data)},a.onstop=async()=>{let a=new Blob(t,{type:"audio/webm"});await eo(a),e.getTracks().forEach(e=>e.stop())},a.start(),z(a),M(!0),U(0),K.current=setInterval(()=>{U(e=>e+1)},1e3)}catch(e){console.error("Error starting recording:",e),alert("Tidak bisa mengakses mikrofon. Pastikan izin mikrofon sudah diberikan.")}}async function eo(a){if(!r.supabase||!u){console.error("uploadVoice: Missing supabase or user");return}y(!0);try{let t=`${Date.now()}-${Math.random().toString(36).substr(2,9)}.webm`,s=`${u.id}/${t}`;console.log("Uploading voice to:",s);let{error:i,data:n}=await r.supabase.storage.from("voice-messages").upload(s,a);if(i)throw console.error("Upload error:",i),i;console.log("Upload successful:",n);let{data:l}=r.supabase.storage.from("voice-messages").getPublicUrl(s);if(console.log("Public URL:",l.publicUrl),!l.publicUrl)throw Error("Failed to get public URL");console.log("Inserting message with voice_url:",l.publicUrl);let{error:c,data:m}=await r.supabase.from("chat_messages").insert({sender_id:u.id,receiver_id:e,order_id:o||null,chat_type:d||"support",pesan:"\uD83C\uDFA4 Voice Message",voice_url:l.publicUrl,voice_duration:P,dibaca:!1}).select();if(c)throw console.error("Insert error:",c),c;console.log("Voice message inserted:",m),X()}catch(e){console.error("Error uploading voice:",e),alert("Gagal upload voice message")}finally{y(!1)}}async function ed(a){let t=a.target.files?.[0];if(t&&r.supabase&&u){if(!["image/jpeg","image/png","image/webp","image/gif","application/pdf"].includes(t.type)){alert("Format file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF");return}if(t.size>5242880){alert("Ukuran file maksimal 5MB");return}y(!0);try{let a=t.name.split(".").pop(),s=`${Date.now()}-${Math.random().toString(36).substr(2,9)}.${a}`,i=`${u.id}/${s}`,{error:n,data:l}=await r.supabase.storage.from("chat-attachments").upload(i,t);if(n)throw n;let{data:c}=r.supabase.storage.from("chat-attachments").getPublicUrl(i),m=t.type.startsWith("image/")?"image":"file";await r.supabase.from("chat_messages").insert({sender_id:u.id,receiver_id:e,order_id:o||null,chat_type:d||"support",pesan:h||`📎 ${t.name}`,attachment_url:c.publicUrl,attachment_type:m,reply_to_id:L?.id||null,dibaca:!1}),h||x(""),G(null),X()}catch(e){console.error("Error uploading file:",e),alert("Gagal upload file")}finally{y(!1),J.current&&(J.current.value="")}}}function ec(e){return`${Math.floor(e/60)}:${(e%60).toString().padStart(2,"0")}`}let em=w?p.filter(e=>e.pesan.toLowerCase().includes(w.toLowerCase())):p,eu=function(e){let a=[],t="";return e.forEach(e=>{let s=function(e){let a=new Date(e),t=new Date,s=new Date(t);return(s.setDate(s.getDate()-1),a.toDateString()===t.toDateString())?"Hari ini":a.toDateString()===s.toDateString()?"Kemarin":a.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}(e.created_at);s!==t?(t=s,a.push({date:s,messages:[e]})):a[a.length-1].messages.push(e)}),a}(em);return(0,s.jsxs)("div",{className:"d-flex flex-column",style:{height:"70vh"},children:[(0,s.jsxs)("div",{className:"card-header bg-white border-bottom",children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsxs)("div",{className:"d-flex align-items-center",children:[s.jsx("div",{className:"rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2",style:{width:"40px",height:"40px"},children:"admin"===t?"\uD83D\uDEE1️":"mitra"===t?"\uD83C\uDFEA":"\uD83D\uDC64"}),(0,s.jsxs)("div",{children:[s.jsx("h6",{className:"mb-0",children:a}),(0,s.jsxs)("small",{className:"text-muted",children:["admin"===t?"Admin":"mitra"===t?"Mitra Penjual":"Customer",c&&s.jsx("span",{className:"badge bg-warning text-dark ms-2",children:"\uD83D\uDC41️ Read-Only"}),$&&!c&&s.jsx("span",{className:"badge bg-info text-dark ms-2",children:"✍️ Sedang mengetik..."})]})]})]}),s.jsx("div",{className:"d-flex gap-2",children:s.jsx("button",{className:"btn btn-sm btn-outline-secondary",onClick:()=>D(!k),title:"Cari pesan",children:s.jsx(n.U41,{})})})]}),k&&(0,s.jsxs)("div",{className:"mt-2",children:[s.jsx("input",{type:"text",className:"form-control form-control-sm",placeholder:"Cari dalam percakapan...",value:w,onChange:e=>N(e.target.value)}),w&&(0,s.jsxs)("small",{className:"text-muted",children:["Ditemukan ",em.length," dari ",p.length," pesan"]})]})]}),(0,s.jsxs)("div",{className:"card-body overflow-auto flex-grow-1 bg-light",style:{height:"calc(70vh - 130px)"},children:[0===eu.length?(0,s.jsxs)("div",{className:"text-center py-5 text-muted",children:[s.jsx("div",{style:{fontSize:"48px"},className:"mb-3",children:"\uD83D\uDCAC"}),s.jsx("p",{children:"Belum ada pesan. Mulai percakapan!"})]}):eu.map((e,t)=>(0,s.jsxs)("div",{children:[s.jsx("div",{className:"text-center my-3",children:s.jsx("span",{className:"badge bg-secondary px-3 py-2",children:e.date})}),e.messages.map((t,i)=>{if(t.is_deleted)return s.jsx("div",{className:"mb-2 text-center",children:s.jsx("small",{className:"text-muted fst-italic",children:"\uD83D\uDDD1️ Pesan telah dihapus"})},t.id);let r=t.sender_id===u?.id;0===i||(e.messages[i-1].sender_id,t.sender_id);let o=t.reactions||[],d=(t.starred_by||[]).includes(u?.id||"");return s.jsx("div",{className:`mb-2 ${r?"text-end":"text-start"}`,children:(0,s.jsxs)("div",{className:`d-inline-block ${r?"me-2":"ms-2"}`,style:{maxWidth:"70%"},children:[(0,s.jsxs)("div",{className:`p-3 rounded position-relative ${r?"bg-primary text-white":"bg-white shadow-sm"}`,children:[t.replied_message_preview&&(0,s.jsxs)("div",{className:`mb-2 p-2 rounded border-start border-3 ${r?"bg-white bg-opacity-25 border-light":"bg-primary bg-opacity-10 border-primary"} small`,style:{cursor:"pointer"},children:[(0,s.jsxs)("div",{className:"fw-bold",children:["↩️ ",t.replied_message_preview.sender_name]}),s.jsx("div",{className:"text-truncate",style:{maxWidth:"250px"},children:"voice"===t.replied_message_preview.attachment_type?`🎤 Voice ${t.replied_message_preview.voice_duration}s`:t.replied_message_preview.pesan})]}),t.is_forwarded&&s.jsx("div",{className:"mb-1 small fst-italic",children:"↪️ Forwarded"}),t.pesan&&!t.pesan.startsWith("\uD83D\uDCCE")&&"\uD83C\uDFA4 Voice Message"!==t.pesan&&(R?.id===t.id?(0,s.jsxs)("div",{children:[s.jsx("input",{type:"text",className:"form-control form-control-sm mb-2",value:R.pesan,onChange:e=>A({...R,pesan:e.target.value}),onKeyPress:e=>"Enter"===e.key&&ea(t.id,R.pesan)}),(0,s.jsxs)("div",{className:"d-flex gap-1",children:[s.jsx("button",{className:"btn btn-sm btn-success",onClick:()=>ea(t.id,R.pesan),children:"Save"}),s.jsx("button",{className:"btn btn-sm btn-secondary",onClick:()=>A(null),children:"Cancel"})]})]}):s.jsx("p",{className:"mb-2",style:{whiteSpace:"pre-wrap"},children:t.pesan})),t.attachment_url&&s.jsx("div",{className:"mt-2",children:"image"===t.attachment_type?(0,s.jsxs)("div",{className:"position-relative",children:[s.jsx("img",{src:t.attachment_url,alt:"Attachment",className:"img-fluid rounded cursor-pointer",style:{maxHeight:"300px",cursor:"pointer"},onClick:()=>j(t.attachment_url)}),s.jsx("button",{className:"btn btn-sm btn-light position-absolute bottom-0 end-0 m-2",onClick:()=>window.open(t.attachment_url,"_blank"),title:"Download",children:s.jsx(n.aBF,{})})]}):(0,s.jsxs)("a",{href:t.attachment_url,target:"_blank",rel:"noreferrer",className:`d-flex align-items-center p-2 rounded ${r?"bg-white text-dark":"bg-light"}`,children:[s.jsx(n.pPO,{className:"me-2"}),s.jsx("span",{className:"small",children:"\uD83D\uDCCE Lampiran"}),s.jsx(n.aBF,{className:"ms-auto"})]})}),t.voice_url&&s.jsx("div",{className:"mt-2",children:(0,s.jsxs)("button",{className:`btn btn-sm d-flex align-items-center gap-2 ${r?"btn-outline-light":"btn-outline-primary"}`,onClick:()=>(function(e,a){if(console.log("Attempting to play voice:",e),H===a){Y.current?.pause(),O(null);return}Y.current&&Y.current.pause();try{Y.current=new Audio(e),Y.current.onerror=a=>{console.error("Error playing voice message:",a),console.error("Voice URL:",e),alert("Tidak bisa memutar pesan suara. File mungkin tidak tersedia atau URL sudah expired."),O(null)},Y.current.onplay=()=>{console.log("Voice message playing")},Y.current.play(),O(a),Y.current.onended=()=>{console.log("Voice message finished playing"),O(null)}}catch(e){console.error("Error creating audio player:",e),alert("Gagal memutar pesan suara"),O(null)}})(t.voice_url,t.id),children:[H===t.id?s.jsx(n.JuG,{}):s.jsx(n.gmG,{}),s.jsx("span",{children:"\uD83C\uDFA4 Voice Message"}),t.voice_duration&&(0,s.jsxs)("small",{children:["(",ec(t.voice_duration),")"]})]})}),!c&&(0,s.jsxs)("div",{className:"position-absolute top-0 end-0 mt-1 me-1",children:[s.jsx("button",{className:"btn btn-sm btn-link p-0",onClick:()=>B(q===t.id?null:t.id),style:{color:r?"white":"gray"},children:s.jsx(n.EAB,{})}),q===t.id&&(0,s.jsxs)("div",{className:"dropdown-menu show position-absolute end-0",style:{zIndex:1050},children:[r&&(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)("button",{className:"dropdown-item",onClick:()=>{A(t),B(null)},children:[s.jsx(n.fmQ,{className:"me-2"})," Edit"]}),(0,s.jsxs)("button",{className:"dropdown-item text-danger",onClick:()=>et(t.id),children:[s.jsx(n.Xm5,{className:"me-2"})," Delete"]})]}),(0,s.jsxs)("button",{className:"dropdown-item",onClick:()=>(function(e){let t=e.sender_id===u?.id?"You":a;G({id:e.id,pesan:e.pesan,sender_name:t,attachment_type:e.attachment_type,voice_duration:e.voice_duration}),B(null)})(t),children:[s.jsx(n.Bjt,{className:"me-2"})," Reply"]}),(0,s.jsxs)("button",{className:"dropdown-item",onClick:()=>en(t),children:[s.jsx(n.C$r,{className:"me-2"})," Forward"]}),(0,s.jsxs)("button",{className:"dropdown-item",onClick:()=>er(t.id),children:[d?s.jsx(n.QJe,{className:"me-2 text-warning"}):s.jsx(n.QJe,{className:"me-2"}),d?"Unstar":"Star"]})]})]}),o.length>0&&s.jsx("div",{className:"d-flex flex-wrap gap-1 mt-2",children:Object.entries(o.reduce((e,a)=>(e[a.reaction]||(e[a.reaction]=[]),e[a.reaction].push(a),e),{})).map(([e,a])=>{let i=a.some(e=>e.user_id===u?.id);return(0,s.jsxs)("button",{className:`btn btn-sm rounded-pill ${i?"bg-primary text-white":"bg-light"}`,style:{fontSize:"12px",padding:"2px 6px"},onClick:()=>i?ei(t.id,e):es(t.id,e),title:a.map(e=>e.user_name).join(", "),children:[e," ",a.length]},e)})}),(0,s.jsxs)("div",{className:`d-flex align-items-center mt-2 ${r?"justify-content-end":""}`,children:[(0,s.jsxs)("small",{className:r?"text-white-50":"text-muted",children:[new Date(t.created_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),t.is_edited&&s.jsx("span",{className:"ms-1 fst-italic",children:"(edited)"})]}),r&&s.jsx("span",{className:"ms-1",children:t.dibaca?s.jsx(n.W_7,{className:"text-info",title:"Sudah dibaca"}):s.jsx(n.l_A,{className:"text-white-50",title:"Terkirim"})})]})]}),!c&&(0,s.jsxs)("div",{className:"position-relative d-inline-block",children:[s.jsx("button",{className:"btn btn-sm btn-link p-0 ms-1",onClick:()=>T(V===t.id?null:t.id),style:{fontSize:"16px"},children:"\uD83D\uDE0A"}),V===t.id&&s.jsx("div",{className:"position-absolute bg-white shadow-lg rounded p-1 d-flex gap-1",style:{zIndex:1050,bottom:"100%"},children:l.map(e=>{let a=o.some(a=>a.reaction===e&&a.user_id===u?.id);return s.jsx("button",{className:`btn btn-sm border-0 ${a?"bg-primary":""}`,onClick:()=>a?ei(t.id,e):es(t.id,e),children:e},e)})})]})]})},t.id)})]},t)),s.jsx("div",{ref:W})]}),(0,s.jsxs)("div",{className:"card-footer bg-white border-top",children:[L&&s.jsx("div",{className:"mb-2 p-2 bg-light rounded border-start border-3 border-primary",children:(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[(0,s.jsxs)("div",{className:"small",children:[(0,s.jsxs)("div",{className:"fw-bold",children:["↩️ Replying to ",L.sender_name]}),s.jsx("div",{className:"text-muted text-truncate",style:{maxWidth:"500px"},children:"voice"===L.attachment_type?`🎤 Voice ${L.voice_duration}s`:L.pesan})]}),s.jsx("button",{className:"btn btn-sm btn-link text-danger",onClick:()=>G(null),children:s.jsx(n.aHS,{})})]})}),c&&s.jsx("div",{className:"alert alert-info small mb-2 py-2 text-center",children:"\uD83D\uDD12 Mode Monitoring: Anda hanya dapat melihat percakapan ini"}),(0,s.jsxs)("div",{className:"input-group",children:[!c&&(0,s.jsxs)(s.Fragment,{children:[s.jsx("button",{className:"btn btn-outline-secondary",onClick:()=>J.current?.click(),disabled:_||F,title:"Upload foto/file",children:_?s.jsx("span",{className:"spinner-border spinner-border-sm"}):s.jsx(n.H3h,{})}),s.jsx("input",{ref:J,type:"file",accept:"image/*,.pdf",onChange:ed,className:"d-none"})]}),s.jsx("input",{type:"text",className:"form-control",placeholder:F?`Recording... ${ec(P)}`:c?"Mode read-only...":L?"Reply with a message...":"Ketik pesan...",value:h,onChange:e=>x(e.target.value),onKeyPress:e=>"Enter"===e.key&&!c&&ee(),disabled:c||b||F}),!c&&s.jsx("button",{className:`btn ${F?"btn-danger":"btn-outline-secondary"}`,onClick:F?function(){I&&"inactive"!==I.state&&I.stop(),M(!1),U(0),K.current&&clearInterval(K.current)}:el,disabled:_,title:F?"Stop recording":"Record voice",children:F?s.jsx(n.JuG,{}):s.jsx(n.uYL,{})}),s.jsx("button",{className:"btn btn-primary",onClick:ee,disabled:c||b||!h.trim()||F,children:b?s.jsx("span",{className:"spinner-border spinner-border-sm"}):s.jsx(n.Y2X,{})})]}),s.jsx("small",{className:"text-muted mt-1 d-block",children:"\uD83D\uDCCE JPG, PNG, WebP, GIF, PDF • Max 5MB • \uD83C\uDFA4 Voice messages supported"})]}),v&&s.jsx("div",{className:"position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center",style:{zIndex:9999},onClick:()=>j(null),children:(0,s.jsxs)("div",{className:"position-relative",children:[s.jsx("button",{className:"btn btn-light position-absolute top-0 end-0 m-2 rounded-circle",onClick:()=>j(null),style:{width:"40px",height:"40px"},children:s.jsx(n.aHS,{})}),s.jsx("img",{src:v,alt:"Preview",className:"img-fluid rounded",style:{maxHeight:"90vh",maxWidth:"90vw"},onClick:e=>e.stopPropagation()}),(0,s.jsxs)("a",{href:v,target:"_blank",rel:"noreferrer",className:"btn btn-primary position-absolute bottom-0 end-0 m-2",onClick:e=>e.stopPropagation(),children:[s.jsx(n.aBF,{className:"me-1"})," Download"]})]})})]})}},8270:(e,a,t)=>{t.d(a,{Z:()=>l});var s=t(326),i=t(7577),r=t(4690),n=t(4046);function l({isOpen:e,onClose:a,messageToForward:t}){let{user:l}=(0,r.a)(),[o,d]=(0,i.useState)([]),[c,m]=(0,i.useState)(""),[u,p]=(0,i.useState)([]),[g,h]=(0,i.useState)(!0),[x,b]=(0,i.useState)(""),[f,_]=(0,i.useState)(!1);async function y(){if(r.supabase&&l&&t&&0!==u.length){_(!0);try{let e=u.map(async e=>{let a=g?x?`${x}

--- Forwarded Message ---
${t.pesan}`:`--- Forwarded Message ---
${t.pesan}`:x||t.pesan,{error:s}=await r.supabase.from("chat_messages").insert({sender_id:l.id,receiver_id:e,order_id:null,chat_type:"support",pesan:a,attachment_url:t.attachment_url||null,attachment_type:t.attachment_type||null,voice_url:t.voice_url||null,voice_duration:t.voice_duration||null,forwarded_from_id:t.id,is_forwarded:!0,dibaca:!1});if(s)throw s});await Promise.all(e),alert(`Pesan berhasil di-forward ke ${u.length} kontak`),a()}catch(e){console.error("Error forwarding message:",e),alert("Gagal forward pesan")}finally{_(!1)}}}let v=o.filter(e=>e.nama?.toLowerCase().includes(c.toLowerCase()));return e&&t?s.jsx("div",{className:"position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center",style:{zIndex:9998},onClick:a,children:(0,s.jsxs)("div",{className:"bg-white rounded shadow-lg w-100",style:{maxWidth:"600px",maxHeight:"80vh"},onClick:e=>e.stopPropagation(),children:[(0,s.jsxs)("div",{className:"card-header bg-white d-flex justify-content-between align-items-center",children:[(0,s.jsxs)("h5",{className:"mb-0",children:[s.jsx(n.C$r,{className:"me-2"}),"Forward Pesan"]}),s.jsx("button",{className:"btn btn-sm btn-link",onClick:a,children:s.jsx(n.aHS,{})})]}),(0,s.jsxs)("div",{className:"p-3 border-bottom bg-light",children:[s.jsx("small",{className:"text-muted",children:"Pesan yang akan di-forward:"}),(0,s.jsxs)("div",{className:"mt-2 p-2 bg-white rounded",children:["image"===t.attachment_type&&s.jsx("div",{className:"mb-2 text-muted small",children:"\uD83D\uDCCE Gambar"}),t.voice_url&&(0,s.jsxs)("div",{className:"mb-2 text-muted small",children:["\uD83C\uDFA4 Voice Message (",t.voice_duration,"s)"]}),s.jsx("div",{children:t.pesan})]})]}),(0,s.jsxs)("div",{className:"p-3",style:{maxHeight:"400px",overflowY:"auto"},children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between align-items-center mb-3",children:[(0,s.jsxs)("h6",{className:"mb-0",children:["Pilih Kontak (",u.length," dipilih)"]}),s.jsx("button",{className:"btn btn-sm btn-outline-primary",onClick:function(){p(o.map(e=>e.id))},children:"Pilih Semua"})]}),s.jsx("input",{type:"text",className:"form-control mb-3",placeholder:"Cari kontak...",value:c,onChange:e=>m(e.target.value)}),0===v.length?(0,s.jsxs)("div",{className:"text-center py-4 text-muted",children:[s.jsx(n.Xws,{size:32,className:"mb-2"}),s.jsx("p",{children:"Tidak ada kontak ditemukan"})]}):s.jsx("div",{className:"list-group",children:v.map(e=>{let a=u.includes(e.id);return(0,s.jsxs)("button",{className:`list-group-item list-group-item-action d-flex align-items-center ${a?"active":""}`,onClick:()=>{var a;return a=e.id,void p(e=>e.includes(a)?e.filter(e=>e!==a):[...e,a])},children:[s.jsx("div",{className:"rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2",style:{width:"35px",height:"35px"},children:"admin"===e.role?s.jsx(n.bri,{}):"mitra"===e.role?s.jsx(n.KSn,{}):s.jsx(n.Xws,{})}),(0,s.jsxs)("div",{className:"flex-grow-1",children:[s.jsx("div",{className:"fw-bold small",children:e.nama}),s.jsx("div",{className:"text-muted small",children:"admin"===e.role?"Admin":"mitra"===e.role?"Mitra":"Customer"})]}),a&&s.jsx("span",{className:"badge bg-primary rounded-pill",children:"✓"})]},e.id)})})]}),(0,s.jsxs)("div",{className:"p-3 border-top",children:[(0,s.jsxs)("div",{className:"form-check mb-2",children:[s.jsx("input",{type:"checkbox",className:"form-check-input",id:"includeMessage",checked:g,onChange:e=>h(e.target.checked)}),s.jsx("label",{className:"form-check-label small",htmlFor:"includeMessage",children:"Sertakan pesan tambahan"})]}),g&&s.jsx("textarea",{className:"form-control",rows:2,placeholder:"Tambahkan pesan (opsional)...",value:x,onChange:e=>b(e.target.value)})]}),(0,s.jsxs)("div",{className:"card-footer bg-white d-flex justify-content-end gap-2",children:[s.jsx("button",{className:"btn btn-secondary",onClick:a,children:"Batal"}),s.jsx("button",{className:"btn btn-primary",onClick:y,disabled:0===u.length||f,children:f?(0,s.jsxs)(s.Fragment,{children:[s.jsx("span",{className:"spinner-border spinner-border-sm me-2"}),"Forwarding..."]}):(0,s.jsxs)(s.Fragment,{children:[s.jsx(n.C$r,{className:"me-1"}),"Forward ke ",u.length," kontak"]})})]})]})}):null}},4467:(e,a,t)=>{async function s(e,a,t){try{let s=function(e,a,t){let s=a.map(e=>{if(e.is_deleted)return`<div class="deleted-message">🗑️ Pesan telah dihapus</div>`;let a="You"!==e.sender_name,t=new Date(e.created_at).toLocaleString("id-ID"),s="";if(e.reply_to&&(s+=`<div class="reply-preview">↩️ Membalas ${e.reply_to.sender_name}: ${e.reply_to.pesan}</div>`),e.voice_url?s+=`<div class="voice-message">🎤 Voice Message (${e.voice_duration}s) <em>[Audio tidak dapat diekspor]</em></div>`:e.attachment_url&&("image"===e.attachment_type?s+=`<div class="image-attachment">📎 Gambar: <a href="${e.attachment_url}" target="_blank">Lihat gambar</a></div>`:s+=`<div class="file-attachment">📎 File: <a href="${e.attachment_url}" target="_blank">Download file</a></div>`),e.pesan&&!e.pesan.startsWith("\uD83D\uDCCE")&&"\uD83C\uDFA4 Voice Message"!==e.pesan&&(s+=`<div class="message-text">${function(e){let a=document.createElement("div");return a.textContent=e,a.innerHTML}(e.pesan)}</div>`),e.is_edited&&(s+='<span class="edited-label">(diedit)</span>'),e.reactions&&e.reactions.length>0){let a=e.reactions.map(e=>`<span class="reaction">${e.emoji} ${e.count}</span>`).join(" ");s+=`<div class="reactions">${a}</div>`}return`
      <div class="message ${a?"from-partner":"from-you"}">
        <div class="message-header">
          <span class="sender-name">${e.sender_name}</span>
          <span class="timestamp">${t}</span>
        </div>
        ${s}
      </div>
    `}).join("\n");return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chat Export - ${e}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .-header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .messages-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .message {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    
    .message.from-you {
      background: #e3f2fd;
      margin-left: 50px;
      border-left: 4px solid #2196f3;
    }
    
    .message.from-partner {
      background: #f5f5f5;
      margin-right: 50px;
      border-left: 4px solid #9e9e9e;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .sender-name {
      font-weight: bold;
      color: #666;
    }
    
    .timestamp {
      color: #999;
    }
    
    .message-text {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .reply-preview {
      background: rgba(0,0,0,0.05);
      padding: 8px;
      border-left: 3px solid #2196f3;
      margin-bottom: 8px;
      font-size: 12px;
      border-radius: 4px;
    }
    
    .voice-message,
    .image-attachment,
    .file-attachment {
      background: rgba(0,0,0,0.05);
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .edited-label {
      font-size: 11px;
      color: #999;
      font-style: italic;
    }
    
    .reactions {
      margin-top: 8px;
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
    
    .reaction {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .deleted-message {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 10px;
      font-size: 13px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .messages-container {
        box-shadow: none;
      }
      
      .message {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💬 Chat Export</h1>
    <p>Percakapan dengan <strong>${e}</strong></p>
    <p>${t.start} - ${t.end}</p>
    <p>Total: ${a.length} pesan</p>
  </div>
  
  <div class="messages-container">
    ${s}
  </div>
  
  <div class="footer">
    <p>Diekspor pada: ${new Date().toLocaleString("id-ID")}</p>
    <p>Homebite Chat System</p>
  </div>
</body>
</html>
  `}(e,a,t),i=new Blob([s],{type:"text/html"}),r=URL.createObjectURL(i),n=window.open(r,"_blank");return n&&(n.onload=()=>{n.print()}),{success:!0}}catch(e){return console.error("Error exporting chat:",e),{success:!1,error:e}}}t.d(a,{w:()=>s})},9220:(e,a,t)=>{t.d(a,{i:()=>i});var s=t(4690);async function i(e,a,t,i="info",r){if(!s.supabase){console.error("Supabase tidak tersedia");return}let{error:n}=await s.supabase.from("notifications").insert({user_id:e,title:a,message:t,tipe:i,link:r,dibaca:!1});n&&console.error("Error sending notification:",n)}}};