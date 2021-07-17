import {cases} from './cases'

const {flood, snow, urban, vegetation, water, wildfire} = cases

export const categories = [
  {
    id: 'vegetation',
    text: `Analyse vegetation and geology`,
    cases: vegetation,
  },
  {
    id: 'floods',
    text: `Study floods and droughts`,
    cases: flood,
  },
  {
    id: 'wildfire',
    text: `Investigate wildfires`,
    cases: wildfire,
  },
  {
    id: 'water',
    text: `Inspect ocean and water bodies`,
    cases: water,
  },
  {
    id: 'urban',
    text: `Check urban development`,
    cases: urban,
  },
  {
    id: 'snow',
    text: `Examine snow and glacier`,
    cases: snow,
  },
]
