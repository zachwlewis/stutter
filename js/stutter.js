var source   = $("#task-template").html();
var template = Handlebars.compile(source);
var data = { tasks: []};
var currentTaskIndex;
var currentTask;
var timerID;
var currentTime = 0;
var totalTime = 0;
var timerRunning = false;

var localTasks = localStorage.getItem("tasks");
if (localTasks != null) { data.tasks = JSON.parse(localTasks); }

$( "#confirmTaskButton" ).click(createTask);
$("#taskModal").on("shown.bs.modal", function() {$("#taskName").focus();});
$("#taskModal").on("hidden.bs.modal", clearTaskModal)
$('#progressBarArea').hide();

function createTask()
{
	var taskName = $("#taskName").val();
	var taskDescription = $("#taskDescription").val();
	var newTask = {name: taskName, description: taskDescription};
	data.tasks.push(newTask);
	localStorage.setItem("tasks", JSON.stringify(data.tasks));
	updateTasks(data);
	$('#taskModal').modal('hide');
	return false;
}

function clearTaskModal()
{
	$("#taskName").val("");
	$("#taskDescription").val("");
	return false;
}

function editTask(index)
{

}

function beginTimer()
{
	window.clearInterval(timerID);
	currentTime = 0;
	totalTime = 5;

	$('#timerButton').removeClass('btn-primary');
	$('#timerButton').addClass('btn-danger');
	$('#timerButton').text("End Phrase");
	$("#timerButton").off('click', beginTimer);
	$("#timerButton").on('click', endTimer);

	// Select a task to begin working on.
	if (data.tasks.length > 0)
	{
		if (data.tasks.length > 1 && currentTask != null)
		{
			// More than one task exists. Get one that isn't the current task.
			var newTask;
			do
			{
				newTask = data.tasks[Math.floor(Math.random() * data.tasks.length)];
			} while (newTask == currentTask);

			currentTask = newTask;
		}
		else
		{
			currentTask = data.tasks[Math.floor(Math.random() * data.tasks.length)];
		}

		$('#activeTaskName').text(currentTask.name);
		$("#activeTaskDescription").text(currentTask.description);
	}

	var progressBar = $('#progressBar');
	progressBar.css("width", "0%");

	// Using a closure is needed to maintain reference.
	timerID = window.setInterval(function() {
		currentTime++;
		progressBar.css("width", Math.round(100 * currentTime/totalTime) + "%");
		if (currentTime >= totalTime) { beginTimer(); }
	}, 1000);

	// Show the progress bar area.
	$('#progressBarArea').slideDown(200);

	timerRunning = true;
}

function endTimer()
{
	window.clearInterval(timerID);

	$('#timerButton').removeClass('btn-danger');
	$('#timerButton').addClass('btn-primary');
	$('#timerButton').text("Begin Phrase");

	$("#timerButton").on('click', beginTimer);
	$("#timerButton").off('click', endTimer);

	// Hide the progress bar area.
	$('#progressBarArea').slideUp(200);

	timerRunning = false;
	currentTask = null;
}

function setCurrentTime(currentSeconds, totalSeconds)
{
	var percent = Math.round(currentSeconds/totalSeconds);
	console.log(currentSeconds);
	
}

function selectTask(index)
{
	if (data.tasks[index] != null)
	{
		currentTask = data.tasks[index];
		$('#activeTaskName').text(currentTask.name);
		$("#activeTaskDescription").text(currentTask.description);
	}
}

function updateTasks(dataObjecct)
{
	$("#task-placeholder").html(template(data));
	if (data.tasks.length == 0)
	{
		$('#timerButton').addClass('disabled');
	}
	else if (!timerRunning)
	{
		$("#timerButton").off('click', beginTimer);
		$("#timerButton").on('click', beginTimer);
		$('#timerButton').removeClass('disabled');
	}
}

// Initial setup.
updateTasks(data);

