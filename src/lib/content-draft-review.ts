export function contentReviewPrompts(content: string): string[] {
  const prompts: string[] = [];
  if (/\b(?:prepar(?:e|ing) to launch|we (?:are launching|launch)|our upcoming|will (?:launch|host|deliver))\b/i.test(content)) prompts.push('Does the brief confirm this future activity? If it is still being explored, keep the wording tentative.');
  if (/\b(?:wrap(?:ping)? up|our (?:recent|last|successful)|we (?:hosted|launched|achieved)|week of discussions)\b/i.test(content)) prompts.push('Did this activity actually happen? A planned sequence of posts does not establish that an event or discussion took place.');
  if (/\b\d+(?:\.\d+)?\s*(?:%(?!\w)|(?:customers|participants|attendees|users)\b)/i.test(content)) prompts.push('Check this numerical claim against the source you can substantiate.');
  return prompts;
}
const escape = (text:string) => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function replaceContentPost(text:string,day:number,platform:string,replacement:string):string {
  if (replacement.length>12000 || /^(?:## |### |\*\*(?:Post|Why this works|Hashtags|Best time to post|CTA|Notes)\*\*:)/m.test(replacement)) throw new Error('Keep section headings out of the post editor. Use plain paragraphs for this draft.');
  const dayMatch=new RegExp('^## Day '+day+'\\s*$','m').exec(text);
  if(!dayMatch)throw new Error('This draft could not be located.');
  const dayStart=dayMatch.index;const tail=text.slice(dayStart+dayMatch[0].length);const nextDay=/^## Day \d+\s*$/m.exec(tail);
  const dayEnd=nextDay?dayStart+dayMatch[0].length+nextDay.index:text.length;
  const dayText=text.slice(dayStart,dayEnd);const platformMatch=new RegExp('^### '+escape(platform)+'\\s*$','m').exec(dayText);
  if(!platformMatch)throw new Error('This channel draft could not be located.');
  const start=dayStart+platformMatch.index+platformMatch[0].length;const rest=text.slice(start,dayEnd);const nextPlatform=/^### /m.exec(rest);const block=rest.slice(0,nextPlatform?nextPlatform.index:rest.length);
  const post=/\*\*Post\*\*:[ \t]*\r?\n?/i.exec(block);if(!post)throw new Error('This post section could not be located.');
  const contentStart=post.index+post[0].length;const ending=/\n\*\*Why this works\*\*:/i.exec(block.slice(contentStart));
  if(!ending)throw new Error('This post format needs regenerating before editing.');
  const end=start+contentStart+ending.index;
  return text.slice(0,start+contentStart)+replacement+'\n'+text.slice(end);
}
