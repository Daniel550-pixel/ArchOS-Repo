import { MarketData } from "../types";
const SYMBOLS=["BTC/USD","ETH/USD","XRP/USD","SOL/USD","TSLA","NVDA"];
export function generateMarketData():MarketData[]{return SYMBOLS.map(symbol=>{const basePrice=symbol==="BTC/USD"?65000:symbol==="ETH/USD"?3500:symbol==="NVDA"?900:200;return{symbol,price:basePrice+(Math.random()-.5)*(basePrice*.05),volatility:Math.random()*.5,volume:Math.random()*1000000,trend:Math.random()>.6?"UP":Math.random()>.3?"DOWN":"SIDEWAYS"};});}
