import React,{createContext,useContext,useState} from 'react';
import type {DiscoveryFilters} from '../types';
export const defaultFilters:DiscoveryFilters={query:'',region:'Tất cả',category:'Tất cả',maxPrice:1000000,minRating:0};
const FilterContext=createContext<{filters:DiscoveryFilters;setFilters:(v:DiscoveryFilters)=>void}|null>(null);
export function FilterProvider({children}:{children:React.ReactNode}){const[filters,setFilters]=useState<DiscoveryFilters>(defaultFilters);return <FilterContext.Provider value={{filters,setFilters}}>{children}</FilterContext.Provider>}
export function useFilterStore(){const ctx=useContext(FilterContext);if(!ctx)throw new Error('FilterProvider is missing');return ctx}
