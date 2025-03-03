function convertJsonToHtmlTable(json, headers, tableId) {
    console.log(json)

    var html = ""
      html += `<table id="${tableId}" class="table table-bordered table-striped display compact"><thead><tr>`;
  
      for(x in headers){
        html += `<th>${headers[x]}</th>`
      }
      html += "</tr></thead><tbody>";
  
      for(y in json){
        html += "<tr>"
        for(z in headers){
            html += `<td>${json[y][headers[z]]}</td>`;
        }
        html += "</tr>"
      }
      html += "</tbody></table>";

    return html
   
  }

  function createModal(title, html){
    document.getElementById("createdModal-" + title.replaceAll(" ", "-"))?.remove();
    var modal = document.createElement("div");
    modal.className = "modal fade modalCustom"
    var id = modal.id = "createdModal-" + title.replaceAll(" ", "-");

    modal.innerHTML = `      
    <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">${title}</h4>
      </div>
      <div class="modal-body">
      ${html}
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>`

  document.body.appendChild(modal);


  $('#' + id).modal('show')
  }

  function closeAllModals(){
    $('.modalCustom').modal('hide');
  }

  //Function to sleep x milliseconds
  async function sleep(ms) {
    console.log("Sleeping for " + ms + " milliseconds")
    return await new Promise(resolve => setTimeout(resolve, ms));
  }


  function createSw(config){
    createModal(config.title, config.text);
  }

