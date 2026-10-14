/** Call only after the existing UI has committed a complete, validated result.
 * Reads receipt headers only. Never consumes the response body or stores a token.
 */
export async function acknowledgeCommittedResponse(response: Response, fetcher: typeof fetch = fetch): Promise<boolean> {
 const id=response.headers.get('X-Edge-Receipt-Id'),token=response.headers.get('X-Edge-Receipt-Token');
 if(!response.ok || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id||'') || !/^[a-f0-9]{64}$/.test(token||''))return false;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),2000);
 try {
  const ack=await fetcher('/api/delivery-receipt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,token}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
  return ack.status===204;
 } catch {return false;}
 finally {clearTimeout(timer);}
}
