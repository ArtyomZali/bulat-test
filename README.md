# Bulat test task

## How to run

- clone project
- npm i && npm run dev
- open localhost:3000

## Design moments that worth noticing

- there are no components for nodes and links, because there is no need for them in context of current task and also `v-network-graph` library handles their visual very good and offers a lot of configuration options
- there is no router, because project does not require multiple pages
- `vuetify` has been added to the project for the sake of speed of development
- although there is a UI framework in the project, I didn`t put much effort into visual, because I do not have the understanding of your project UI requirements yet :)
- graph itself and init logic located in `App.vue` and all of the forms located in one modal component. It is a bad practice, it we`re talking about irl project, but for small proof of competence it does not dissonate with me  