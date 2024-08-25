// Fields
const fields = {
     user: document.querySelector('[jsonmaker="user"]'),
     name: document.querySelector('[jsonmaker="name"]'),
     id: document.querySelector('[jsonmaker="id"]'),
     figmaButton: document.querySelector('[jsonmaker="figma-button"]'),
     canvaUrl: document.querySelector('[jsonmaker="canva-url"]'),
     readyButton: document.querySelector('[jsonmaker="ready-button"]'),
     console: document.querySelector('[jsonmaker="console"]'),
     copyButton: document.querySelector('[jsonmaker="copy-button"]'),
     copyText: document.querySelector('[jsonmaker="copy-text"]'),
}
fields.console.style.display = 'none';

// Code block
const codeBlock = {
     text: document.getElementsByClassName('jsonmaker_code-text')[0].querySelector('span'),
     html: document.getElementsByClassName('jsonmaker_code-html')[0].querySelector('span'),
}
// Hidden elements
const lastStepEls = document.querySelectorAll('[jsonmaker="hidden"]');
lastStepEls.forEach((element) => {
     element.style.display = 'none';
});

// State
const state = {
     figmaFilled: false,
     figmaWaiting: false,
     githubWaitingConfirmation: false,
     githubPushed: false,
}

var templateData = {
     name: '',
     id: '',
     figma: {
          text: '',
          html: null,
     },
     canva: {
          url: '',
     },
}


// JSON FILE INFORMATIONS
var commitData = {
     owner: 'WanderlandAgency',
     repo: 'reeeads-data',
     token: document.querySelector('[jsonmaker-token]').getAttribute('jsonmaker-token'),
     path: 'data/',
     filename: '',
     content: '',
     message: {
          user: '',
          action: ' added new template ',
          content: '',
     },
     url: 'https://raw.githubusercontent.com/WanderlandAgency/reeeads-data/main/data/',
}

// Event listeners
// Figma button
fields.figmaButton.addEventListener('click', () => {
     state.figmaWaiting = true
     fields.figmaButton.innerHTML = 'Ctrl + V <-> Cmd + V';
});

// Click event to cancel figma waiting
document.addEventListener('click', (event) => {
     if(event.target !== fields.figmaButton){
          if(state.figmaWaiting) {
               state.figmaWaiting = false;
               fields.figmaButton.innerHTML = 'Click on me !';
          }
     }
});

// Paste event
document.addEventListener('paste', (event) => {
     if (state.figmaWaiting) {
          // Update state
          state.figmaWaiting = false;

          // Update template data
          templateData.figma.text = event.clipboardData.getData('text/plain');
          templateData.figma.html = event.clipboardData.getData('text/html');

          // Update code block to show the copied data
          codeBlock.text.innerHTML = escapeXml(templateData.figma.text);
          codeBlock.html.innerHTML = escapeXml(templateData.figma.html);

          // Update state
          state.figmaFilled = true;

          // Update button text
          fields.figmaButton.innerHTML = 'Filled !';
          setTimeout(() => {
               fields.figmaButton.innerHTML = 'Click on me !';
          }, 2000); 
     }
});

// Ready button event
fields.readyButton.addEventListener('click', () => {
     // Check if figma data is filled
     if (state.figmaFilled) {
          // Check if the file has already been pushed
          if(state.githubWaitingConfirmation) {
               fields.readyButton.innerHTML = 'Pushing file...';
               fields.readyButton.classList.remove('is-warning');
               pushFileToGitHub(commitData.owner, commitData.repo, commitData.path + commitData.filename, templateData, commitData.message.content, commitData.token)
               .then(data => {
                    fields.copyText.innerHTML = commitData.url;
                    lastStepEls.forEach((element) => {
                         element.style.display = 'block';
                    });

                    fields.readyButton.innerHTML = 'File pushed !';
                    fields.readyButton.style.pointerEvents = 'none';
                    fields.readyButton.classList.add('is-success');

                    fields.console.style.display = 'flex';
                    fields.console.querySelector('div').innerHTML = escapeXml(JSON.stringify(data));
                    
               })
               .catch(error => {
                    fields.readyButton.innerHTML = 'Error !';

                    fields.console.style.display = 'flex';
                    fields.console.querySelector('div').innerHTML = error;
               });
          } 
          
          // If not, ask for confirmation
          else {
               state.githubWaitingConfirmation = true;
               fields.readyButton.innerHTML = 'Are you sure ? Everything is correct ?';
               fields.readyButton.classList.add('is-warning');
               // Update data object
               templateData.name = fields.name.value;
               templateData.id = fields.id.value;
               templateData.canva.url = fields.canvaUrl.value;

               // Generate JSON file URL
               commitData.filename = clearURL(templateData.id + "-" + templateData.name + ".json");
               commitData.url += commitData.filename;
               commitData.message.user = fields.user.value;
               commitData.message.content = commitData.message.user + commitData.message.action + templateData.name;
          }
     }
});

fields.copyButton.addEventListener('click', () => {
     navigator.clipboard.writeText(commitData.url)
     .then(() => {
          fields.copyText.innerHTML = 'Copied !';
          setTimeout(() => {
               fields.copyText.innerHTML = commitData.url;
          }, 2000);
     })
});


function downloadJSON(data, filename) {
     const jsonString = JSON.stringify(data);
     const blob = new Blob([jsonString], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     URL.revokeObjectURL(url);
}

function escapeXml(xml) {
     return xml.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;');
}

function clearURL(str) {
     return str.replace(/\s+/g, '-').toLowerCase();
}




async function pushFileToGitHub(owner, repo, path, content, message, token) {
     const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

     // Base64 encode the content
     let base64Content;
     if (typeof Buffer !== 'undefined') {
          base64Content = Buffer.from(content).toString('base64');
     } else if (typeof btoa !== 'undefined') {
          base64Content = btoa(JSON.stringify(content));
     } else {
          const { Base64 } = await import('js-base64');
          base64Content = Base64.encode(content);
     }
 
     const response = await fetch(url, {
         method: 'PUT',
         headers: {
             'Authorization': `token ${token}`,
             'Content-Type': 'application/json'
         },
         body: JSON.stringify({
             message: message,
             content: base64Content
         })
     });
 
     if (!response.ok) {
         throw new Error(`GitHub API responded with status ${response.status}`);
     }
 
     const data = await response.json();
     return data;
 }