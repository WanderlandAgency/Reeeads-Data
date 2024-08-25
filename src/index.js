const items = document.querySelectorAll('[reeeads-data]')
const itemsData = {};

items.forEach((item) => {
     jsonUrl = item.getAttribute('reeeads-data');
     let figmaButton = item.querySelector('[reeeads-button="figma"]');
     let canvaButton = item.querySelector('[reeeads-button="canva"]');

     if(jsonUrl !== null && jsonUrl !== undefined) {
          fetch(jsonUrl)
          .then(response => response.json())
          .then(data => {
               console.log('success');
               canvaButton.href = data.canva.url;
          })
          .catch(error => console.error(error));
     }
     console.log(jsonUrl);
     figmaButton.addEventListener('click', (e) => {
          console.log(item.getAttribute('reeeads-data'));
          console.log('Figma button clicked');
          fetch(item.getAttribute('reeeads-data'))
               .then(response => response.json())
               .then(data => {
                    console.log(data)
                    copyToClipboard(data.figma.text, data.figma.html);
                    item.querySelector('.button__label').innerHTML = 'Copied!';
                    setTimeout(() => {
                         item.querySelector('.button__label').innerHTML = 'Copy';
                    }, 2000);
               })
               .catch(error => console.error(error));
     });
});

async function copyToClipboard(text, html) {
     const blob = new Blob([html], { type: 'text/html' });
   
     try {
       await navigator.clipboard.write([
         new ClipboardItem({
           'text/plain': new Blob([text], { type: 'text/plain' }),
           'text/html': blob
         })
       ]);
       console.log('Text and HTML copied to clipboard');
     } catch (err) {
       console.error('Failed to copy text and HTML: ', err);
     }
   }