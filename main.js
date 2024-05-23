/*** Constants ***/
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const themeBtn = document.getElementById("theme-btn");

/*** Event Listeners ***/
window.addEventListener("resize", setFilterUi);
themeBtn.onclick = toggleTheme;
taskList.addEventListener('dragover', handleDragOver);
taskList.querySelectorAll("li").forEach(draggable => {
    draggable.addEventListener('dragstart', handleDragStart);
    draggable.addEventListener('dragend', handleDragEnd);
});
const addTaskBtn = document.getElementById('addTaskBtn');
addTaskBtn.onclick = addTask;

/*** Functions ***/
function loadTasks(filterOp = "All") {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    taskList.innerHTML = '';
    let activeTasksCounter = 0;

    tasks.forEach(task => {
        const taskItem = createTaskElement(task);

        if (!task.completed) {
            activeTasksCounter++;
        }
        
        if ((filterOp === "Completed" && task.completed) ||
            (filterOp === "Active" && !task.completed) ||
            (filterOp === "All")) {
           console.log(taskItem)
            taskList.appendChild(taskItem);
        }
    });

    updateItemsCount(activeTasksCounter);
}

function createTaskElement(task) {
    const taskItem = document.createElement('li');
    taskItem.setAttribute("draggable", "true");
    taskItem.setAttribute("class", "todo-content");
    taskItem.innerHTML = `
        <span class="check-btn"></span>
        <p>${task.text}</p>
        <img class="remove-task" src="./images/icon-cross.svg" alt="">
    `;
    taskItem.classList.toggle('completed', task.completed);

    taskItem.querySelector(".check-btn").addEventListener('click', toggleTaskState);
    taskItem.querySelector(".remove-task").addEventListener('click', removeTask);
    addDraggingEvent(taskItem);

    return taskItem;
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText !== '' && taskText.length > 0) {
        const taskItem = createTaskElement({ text: taskText, completed: false });
        taskList.appendChild(taskItem);
        taskInput.value = '';

        updateLocalStorage(taskText, false);
        updateItemsCount(getActiveTasksCount() + 1);
    }
}

function toggleTaskState(event) {
    const taskItem = event.currentTarget.parentElement;
    if(!taskItem.classList.contains("completed")){
        const taskText = taskItem.querySelector("p").textContent;
        taskItem.classList.toggle('completed');
        updateTaskStateInLocalStorage(taskText);
        updateItemsCount(getActiveTasksCount());
    }
}

function removeTask(event) {
    const taskItem = event.currentTarget.parentElement;
    const taskText = taskItem.querySelector("p").textContent;
    taskList.removeChild(taskItem);
    removeFromLocalStorage(taskText);
    updateItemsCount(getActiveTasksCount());
}

function clearCompleted() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const completedTasks = taskList.querySelectorAll("li.completed");
    
    tasks.forEach(task => {
        if (task.completed) {
            removeFromLocalStorage(task.text);
        }
    });

    completedTasks.forEach(task => {
        taskList.removeChild(task);
    });
}

function setFilterUi() {
    // UI setup code for filter controls
    const screenWidth = document.body.clientWidth;
    const content = document.querySelector(".content");
    content.querySelectorAll(".control").forEach(element=>{
        content.removeChild(element);
    })
    if(screenWidth < 768){
        content.insertAdjacentHTML("beforeend",
            `
            <div class="control mobile">
            <p id="items-count"><span></span> left</p>
            <button id="clear-completed">Clear Completed</button>
            </div>
            <div class="control filter">
                <div id="filter">
                <button>All</button>
                <button>Active</button>
                <button>Completed</button>
                </div>
            </div>
            `
        )
    }
    else{
        content.insertAdjacentHTML("beforeend",
            `
            <div class="control" >
                <p id="items-count"><span></span> left</p>
                <div id="filter">
                    <button>All</button>
                    <button>Active</button>
                    <button>Completed</button>
                </div>
                <button id="clear-completed">Clear Completed</button>
            </div>
            `
        )
    }
    const filter = document.getElementById('filter');
    filter.addEventListener("click",event=>{
        const btns = filter.querySelectorAll('button');
        btns.forEach(element=>{
            element.classList.remove("active");
        })
        loadTasks(event.target.innerHTML);
        event.target.classList.add("active");
    });
    const clearCompletedBtn = document.getElementById('clear-completed');
    clearCompletedBtn.onclick = clearCompleted;
}

function handleDragStart(event) {
    const taskItem = event.currentTarget;
    taskItem.classList.add('dragging');
    taskItem.setAttribute("pos", getChildIndex(taskItem));
}

function handleDragEnd(event) {
    const taskItem = event.currentTarget;
    taskItem.classList.remove('dragging');
    const oldPos = parseInt(taskItem.getAttribute("pos"));
    const newPos = getChildIndex(taskItem);
    reOrderTasks(oldPos, newPos);
    taskItem.removeAttribute("pos");
}

function handleDragOver(event) {
    event.preventDefault();
    const afterElement = getDragAfterElement(event.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
}
function getDragAfterElement(y) {
    const draggableElements = [...taskList.querySelectorAll('li:not(.dragging)')]
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child }
        } else {
            return closest
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element
}
function addDraggingEvent(element){
    element.addEventListener('dragstart', () => {
        element.classList.add('dragging');
        element.setAttribute("pos",getChildIndex(element))
    })
    
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        let pos = element.getAttribute("pos")
        reOrderTasks(parseInt(pos),getChildIndex(element));
        element.removeAttribute("pos");
    })
}
function getChildIndex(element) {
    return Array.prototype.indexOf.call(taskList.children, element);
}

function reOrderTasks(oldPos, newPos) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    if(tasks){
        if (oldPos > newPos){
            let temp = tasks[oldPos];
            for(let i= oldPos;i>=newPos;i--){
                tasks[i] = tasks[i-1];
            }
            tasks[newPos] = temp;
        }
        else{
            let temp = tasks[oldPos];
            for(let i= oldPos;i<newPos;i++){
                tasks[i] = tasks[i+1];
            }
            tasks[newPos] = temp;
        }
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    themeBtn.src = document.body.classList.contains("dark") ? "./images/icon-sun.svg" : "./images/icon-moon.svg";
}

/*** Utility Functions ***/
function updateLocalStorage(taskText, completed) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ text: taskText, completed: completed });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateTaskStateInLocalStorage(taskText) {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const taskIndex = tasks.findIndex(task => task.text === taskText);
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function removeFromLocalStorage(taskText) {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const taskIndex = tasks.findIndex(task => task.text === taskText);
    tasks.splice(taskIndex, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getActiveTasksCount() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    return tasks.filter(task => !task.completed).length;
}

function updateItemsCount(count) {
    const itemsCount = document.querySelector('#items-count span');
    itemsCount.textContent = count;
}

/*** Initialization ***/
setFilterUi();
window.addEventListener('load', () => {
    loadTasks();
});
