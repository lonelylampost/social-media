
    let sidebar = document.getElementById('sidebar')
    let menu = document.getElementById('menu')

function menuDisplay() {
    sidebar.classList.remove('hide')
}

window.addEventListener('click', function(event) {
    if (event.target !== sidebar && event.target !== menu) {
        sidebar.classList.add('hide')
    }
  })

function openGame() {
    console.log('openGame')
}

function onlyOne(checkbox) {
    let checkboxes = document.getElementsByName('check')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
        if (item.value < checkbox.value) item.checked = true
    })
}

function openNewPost() {
    document.getElementById('newusercomment').classList.remove('hide')
}

function openUpdateNote() {
    document.getElementById('updatenote').classList.remove('hide')
}

function closeUpdateNote() {
    document.getElementById('updatenote').classList.add('hide')
}

function confirmNewPost() {
    document.getElementById('newusercomment').classList.add('hide')
}

function openNewComm() {
    document.getElementById('createcomment').classList.remove('hide')
}

function confirmNewComm() {
    document.getElementById('createcomment').classList.add('hide')
}


function openNewNote() {
    document.getElementById('newusernote').classList.remove('hide')
}

function confirmNewNote() {
    document.getElementById('newusernote').classList.add('hide')
}

function openNewReply() {
    document.getElementById('newuserreply').classList.remove('hide')
}

function confirmNewReply() {
    document.getElementById('newuserreply').classList.add('hide')
}