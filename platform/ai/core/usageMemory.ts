const usageMap = new Map<string, {tokens:number, reset:number}>();

const DAILY_LIMIT = 150000; // safe prototype
const RESET_MS = 1000 * 60 * 60 * 24;

export function checkLimit(userId:string){

  const now = Date.now();
  let row = usageMap.get(userId);

  if(!row){
    usageMap.set(userId,{tokens:0, reset: now+RESET_MS});
    return;
  }

  if(now > row.reset){
    row.tokens = 0;
    row.reset = now + RESET_MS;
  }

  if(row.tokens > DAILY_LIMIT){
    throw new Error("Daily AI limit reached");
  }
}

export function trackUsage(userId:string, tokens:number){

  const row = usageMap.get(userId);
  if(!row) return;

  row.tokens += tokens;
}