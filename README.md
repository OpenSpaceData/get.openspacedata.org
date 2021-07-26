# Frontend for get.openspacedata.org

This svelte app provides the frontend UI for OpenSpaceData. It provides the request form to accessing the data and requesting the individual guides to get the information out of the data. This svelte app connects with the [OpenSpaceData API](https://github.com/OpenSpaceData/api.openspacedata.org).

More information about the idea of OpenSpaceData you can read here:  *[Interview: OpenSpaceData Wants to Democratise Access to Satellite Data](https://en.reset.org/blog/interview-openspacedata-wants-democratise-access-satellite-data-05252021)*

## Prototype

There is a clickable wireframe that shows the functionality and output of the frontend. Try it out: https://www.figma.com/proto/KovwIzegMALA6qJjGabT7D/%5BOSD%5D-Wireframe-Frontend?node-id=111%3A10&scaling=min-zoom

## Run Locally

Clone the project:

```bash
  git clone https://github.com/OpenSpaceData/get.openspacedata.org.git
```

Install the dependencies...

```bash
cd get.openspacedata.org
npm install
```

...then start the app:

```bash
npm run dev
```

Navigate to [localhost:3000](http://localhost:3000). You should see the app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## The app

The app has two main routes - form & guide. You will find both in the `src/routes` folder of the project. The form view is the `index.svelte` (the first route that is loaded when the app is launched). The guide route is in the `guide.svelte` file.

To view content on the guide page, one must first complete the questions in the form view. As questions are completed the responses are retained in a Svelte store (`src/lib/store/index.js`). 

### Data structure

All information relating to research categories & cases is kept in the `src/guides` folder. 
```js
guides
 ┣ vegetation
 ┃ ┣ cateogry.md // The category.md file stores a category id & text string in frontmatter (see example below)
 ┃ ┗ cases
 ┃   ┣ barren-soil // Content for each case is kept in a sub-folder (case/...) to avoid clutter
 ┃   ┃ ┣ case.md // The case.md file stores a case heading & difficulty strings in frontmatter (see example below)
 ┃   ┃ ┣ introduction.md // Introduction into the topic and the upcoming work
 ┃   ┃ ┣ interpret.md // Guide to interpret the data right and further resources to the topic
 ┃   ┃ ┗ process.md // Step-by-step guide to process and editing the data
 ┃   ┗ ...
 ┗ ...
```

#### Example `category.md`
```yaml
---
id: 'vegetation'
text: 'Analyse vegetation and geology'
---
```

#### Example `case.md`
```ymal
---
heading: 'Visualizing Barren Soil'
difficulty: 'moderate'
---
```


The planned guides for the `Beta` version:
![Planned use cases](/use_cases.png)

## API data

The file `api-respond.json` is located in the `static/sample` folder. It is an example of an API respond by the [OpenSpaceData API](https://github.com/OpenSpaceData/api.openspacedata.org).

## Funding

This project is funded by the [German Federal Ministry of Education and Research](http://bmbf.de)
and is part of the 9th round of the [Prototype Fund](http://prototypefund.de).

![Logo of Prototype Fund, Open Knowledge Foundation and the German Federal Ministry of Education and Research](https://github.com/OpenSpaceData/api.openspacedata.org/blob/master/assets/funding-logos.png)
