# Frontend for get.openspacedata.org

This svelte app provide the frontend UI for OpenSpaceData. It provides the request form to accessing the data and requesting the individual guides to get the information out of the data. This svelte app connects with the [OpenSpaceData API](https://github.com/OpenSpaceData/api.openspacedata.org).

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

Navigate to [localhost:5000](http://localhost:5000). You should see the app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## The app

To switch between the form view and the guide view, you have to change the `form` variable in `form.svelte`:

```js
let form = { display: true }; // = form view is shown; false = guide view is shown
```

To switch between the categories and the use cases in question 1, you have to change the `choice`variable in `form.svelte`:

```js
let choice = { category: true }; // = categories are shown; false = use cases are shown
```

## Guides

The guides are the content which guides the users through the process for downloading and editing the satellite imagery and help them to interpret the data correctly.

Structure for guides:

```js
.
├──guides
│  ├──example-guide-1 // e.g. 'green-vegetation-health'
│  │  ├──introduction.md // Introduction into the topic and the upcoming work
│  │  ├──process.md // Step-by-step guide to process and editing the data
│  │  └──interpret.md // Guide to interpret the data right and further resources to the topic
│  ├──example-guide-2 
│  │  ├──introduction.md
│  │  ├──process.md
│  │  └──interpret.md
│  └──...
└── ...
```

The planned guides for the `Beta` version:
![Planned use cases](/use_cases.png)

## API data

The file `api-respond.json` is located in the root folder. It is an example of an API respond by the [OpenSpaceData API](https://github.com/OpenSpaceData/api.openspacedata.org).

## Funding

This project is funded by the [German Federal Ministry of Education and Research](http://bmbf.de)
and is part of the 9th round of the [Prototype Fund](http://prototypefund.de).

![Logo of Prototype Fund, Open Knowledge Foundation and the German Federal Ministry of Education and Research](https://github.com/OpenSpaceData/api.openspacedata.org/blob/master/assets/funding-logos.png)
