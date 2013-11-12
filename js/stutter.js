var source   = $("#task-template").html();
var template = Handlebars.compile(source);
var data = { tasks: [], completed: []};
var currentTaskIndex;

/** The active task. */
var currentTask;

/** The currently selected task in the list. */
var selectedTask;
var timerID;
var currentTime = 0;
var totalPhraseTime = 10;
var totalBlockTime = 5;
var timerRunning = false;
var inPhrase = false;

var localTasks = localStorage.getItem("stutterTasks");
if (localTasks != null) { data = JSON.parse(localTasks); }

$( "#confirmTaskButton" ).click(createTask);
$("#taskModal").on("shown.bs.modal", function() {$("#taskName").focus();});
$("#taskModal").on("hidden.bs.modal", clearTaskModal);
$('#progressBarArea').hide();
$('#completeButton').hide();

function createTask()
{
	var taskName = $("#taskName").val();
	var taskDescription = $("#taskDescription").val();
	var newTask = {name: taskName, description: taskDescription};
	data.tasks.push(newTask);
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

function beginTimer(isBlock)
{
	window.clearInterval(timerID);

	// If there are no valid tasks, we should stop the timer and quit.
	if (data.tasks.length <= 0)
	{
		endTimer();
		return;
	}

	$('#timerButton').removeClass('btn-primary');
	$('#timerButton').addClass('btn-danger');
	$('#timerButton').html("<i class=\"fa fa-stop\"></i> End Phrase");
	$("#timerButton").off('click', beginTimer);
	$("#timerButton").on('click', endTimer);
	$('#completeButton').show();
	$('#completeButton').addClass("btn-success");
	$('#completeButton').removeClass("btn-warning");
	$('#completeButton').html("<i class=\"fa fa-check-square-o\"></i> Complete</a>");
	$('#completeButton').unbind("click");
	$('#completeButton').click(completeTask);

	timerRunning = true;
	currentTime = 0;

	var progressBar = $('#progressBar');

	// Using a closure is needed to maintain reference.
	timerID = window.setInterval(function() {
		currentTime++;
		if (inPhrase)
		{
			progressBar.css("width", Math.round(100 * currentTime/totalPhraseTime) + "%");
			if (currentTime >= totalPhraseTime) { beginTimer(true); }
		}
		else
		{
			progressBar.css("width", 100 - Math.round(100 * currentTime/totalBlockTime) + "%");
			if (currentTime >= totalBlockTime) { beginTimer(false); }
		}
		
		
	}, 1000);

	if (isBlock === true)
	{
		progressBar.addClass("progress-bar-danger");
		progressBar.css("width", "100%");
		inPhrase = false;

		document.getElementById('blockAlertAudio').play();
	}
	else
	{
		// Set up a new phrase.
		progressBar.removeClass("progress-bar-danger");
		progressBar.css("width", "0%");
		inPhrase = true;

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
			$('#activeTaskDescription').text(currentTask.description);
		}
	}

	// Show the progress bar area.
	$('#progressBarArea').slideDown(200);
}

function endTimer()
{
	window.clearInterval(timerID);

	$('#timerButton').removeClass('btn-danger');
	$('#timerButton').addClass('btn-primary');
	$('#timerButton').html("<i class=\"fa fa-play\"></i> Begin Phrase");

	$("#timerButton").on('click', beginTimer);
	$("#timerButton").off('click', endTimer);

	// Hide the progress bar area.
	$('#progressBarArea').slideUp(200);
	$('#completeButton').hide();

	$('#progressBar').removeClass("progress-bar-danger");

	inPhrase = false;
	timerRunning = false;
	currentTask = null;

	updateTasks(data);
}

function completeTask()
{
	if (currentTask != null)
	{
		// Does the task exist in the tasks list?
		taskIndex = data.tasks.indexOf(currentTask);

		if (taskIndex >= 0)
		{
			data.completed.push(currentTask);
			data.tasks.splice(taskIndex, 1);
		}

		// Redraw
		updateTasks(data);

		$('#completeButton').removeClass("btn-success");
		$('#completeButton').addClass("btn-warning");
		$('#completeButton').html("<i class=\"fa fa-square-o\"></i> Undo</a>");
		$('#completeButton').unbind("click");
		$('#completeButton').click(revertTask);
		// TODO: Should we stop the timer?
	}
}

function revertTask()
{
	if (currentTask != null)
	{
		// Does the task exist in the completed list?
		taskIndex = data.completed.indexOf(currentTask);

		if (taskIndex >= 0)
		{
			data.tasks.push(currentTask);
			data.completed.splice(taskIndex, 1);
		}

		// Redraw
		updateTasks(data);

		$('#completeButton').addClass("btn-success");
		$('#completeButton').removeClass("btn-warning");
		$('#completeButton').html("<i class=\"fa fa-check-square-o\"></i> Complete</a>");
		$('#completeButton').unbind("click");
		$('#completeButton').click(completeTask);
	}
}

function setCurrentTime(currentSeconds, totalSeconds)
{
	var percent = Math.round(currentSeconds/totalSeconds);
}

function selectTask(index)
{
	if (data.tasks[index] != null)
	{
		selectedTask = data.tasks[index];
	}
}

function selectCompleted(index)
{
	if (data.completed[index] != null)
	{
		selectedTask = data.selected[index];
	}
}

function updateTasks(dataObjecct)
{
	// Save tasks locally.
	localStorage.setItem("stutterTasks", JSON.stringify(data));

	// Render with Handlebars.
	$("#task-placeholder").html(template(data));

	if (data.tasks.length == 0 && currentTask == null)
	{
		$('#timerButton').addClass('disabled');
	}
	else if (!timerRunning)
	{
		$('#timerButton').off('click', beginTimer);
		$('#timerButton').on('click', beginTimer);
		$('#timerButton').removeClass('disabled');
	}
}

// Initial setup.
updateTasks(data);

