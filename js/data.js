const base_id =  `appT6MxCMM1TOQtJh`;
const table_id = `projects`;
const token = `patIMVurKxlCvdXXD.5280faf7e8793979a73f929dfe704d60dbd4abca8f4dc1d0379c0455ac477565`;
 
async function fetchData() 
{
    const response = await fetch(`https://api.airtable.com/v0/${base_id}/${table_id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}

async function init() 
{
    let projectsArray = [];
    const projects = await fetchData();
    console.log(projects);
    projects.records.forEach(project => {
        projectsArray.push(project.fields);
    });

    projectsArray.sort((a, b) => a.id - b.id);
    console.log(projectsArray);

    projectsArray.forEach(project => {
        //----------------
        const projectCard = document.createElement('div');
        projectCard.textContent = project.title;
        document.querySelector(`.projects-grid`).appendChild(projectCard);

        //----------------
    });
}

init();