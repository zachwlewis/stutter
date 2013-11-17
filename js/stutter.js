var source   = $("#task-template").html();
var template = Handlebars.compile(source);
var data = { tasks: [], completed: []};


/** The active task. */
var currentTask;
/** The index of the active task. */
var currentTaskIndex;

/** The currently selected task in the list. */
var selectedTask;
var timerID;
var currentTime = 0;

var timerRunning = false;
var inPhrase = false;

// Settings
/** Should a sound be played when a phrase is up? */
var playSound = true;
/** The length of a phrase in seconds. */
var totalPhraseTime = 1500; // 25 minutes
/** The length of a block in seconds. */
var totalBlockTime = 300; // 5 minutes

var localTasks = localStorage.getItem("stutterTasks");
if (localTasks != null) { data = JSON.parse(localTasks); }

// Ignore any selections.
for (var i = data.tasks.length - 1; i >= 0; i--)
{
	if (data.tasks[i] != null)
	{
		data.tasks[i].selected = false;
	}
	else
	{
		console.log("Removed "+JSON.stringify(data.tasks[i])+" from data.tasks.");
		data.tasks.splice(i,1);
	}
}

for (var i = data.completed.length - 1; i >= 0; i--)
{
	if (data.completed[i] != null)
	{
		data.completed[i].selected = false;
	}
	else
	{
		console.log("Removed "+JSON.stringify(data.completed[i])+" from data.completed.");
		data.completed.splice(i,1);
	}
}

$('#taskModal form').submit(function(event) { createTask(); event.preventDefault(); });
$('#taskModal').on("shown.bs.modal", function() { $('#taskName').focus(); });
$('#taskModal').on("hidden.bs.modal", function() { clearTaskModal(); });
$('#progressBarArea').hide();
$('#completeButton').hide();
$('#playAlertControl').change(function() { updateSettings(); });
$('#phraseLengthControl').change(function() { updateSettings(); });
$('#blockLengthControl').change(function() { updateSettings(); });

function createTask()
{
	var taskName = $("#taskName").val();
	var taskDescription = $("#taskDescription").val();

	if (taskName == "")
	{
		// Display an error.
		$('#taskNameGroup').addClass("has-error");
		$('#taskNameGroup .help-block').remove();
		$('#taskNameGroup').append("<span class=\"help-block\">A name is required for the task.</span>");
	}
	else
	{
		var newTask = {name: taskName, description: taskDescription};
		data.tasks.push(newTask);
		updateTasks();

		$('#taskModal').modal('hide');
	}
}

function clearTaskModal()
{
	$("#taskName").val("");
	$("#taskDescription").val("");
	$('#taskNameGroup').removeClass("has-error");
	$('#taskNameGroup .help-block').remove();
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

		if (playSound)
		{
			document.getElementById('blockAlertAudio').play();
		}
	}
	else
	{
		// Set up a new phrase.
		progressBar.removeClass("progress-bar-danger");
		progressBar.css("width", "0%");
		inPhrase = true;
		var currentIndex;
		// Select a task to begin working on.
		if (data.tasks.length > 0)
		{
			if (data.tasks.length > 1 && currentTask != null)
			{
				// More than one task exists. Get one that isn't the current task.
				var newTask;
				do
				{
					currentTaskIndex = Math.floor(Math.random() * data.tasks.length);
					newTask = data.tasks[currentTaskIndex];
				} while (newTask == currentTask);

				currentTask = newTask;
			}
			else
			{
				currentTaskIndex = Math.floor(Math.random() * data.tasks.length);
				currentTask = data.tasks[currentTaskIndex];
			}

			// Mark task as active.
			$('#taskList .current-task').removeClass("current-task");
			$('#taskList a:nth-child('+(currentTaskIndex + 1)+')').addClass("current-task");

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

	$('#progressBar').removeClass("progress-bar-danger");

	inPhrase = false;
	timerRunning = false;
	currentTask = null;

	updateTasks();
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
		updateTasks();

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
		updateTasks();

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
	if (selectedTask != null)
	{
		selectedTask.selected = false;
	}

	if (data.tasks[index] != null)
	{
		// Has the user selected the selected task?
		if (selectedTask == data.tasks[index])
		{
			selectedTask.selected = false;
			selectedTask = null;
		}
		else
		{
			selectedTask = data.tasks[index];
			selectedTask.selected = true;
		}
	}

	updateTasks();
}

function selectCompleted(index)
{
	if (selectedTask != null)
	{
		selectedTask.selected = false;
	}

	if (data.completed[index] != null)
	{
		// Has the user selected the selected task?
		if (selectedTask == data.completed[index])
		{
			selectedTask.selected = false;
			selectedTask = null;
		}
		else
		{
			selectedTask = data.completed[index];
			selectedTask.selected = true;
		}
	}

	updateTasks();
}

function deleteTask(target)
{
	var taskIndex = data.tasks.indexOf(target);
	if (taskIndex < 0)
	{
		// The task is completed.
		taskIndex = data.completed.indexOf(target);
		data.completed.splice(taskIndex, 1);
	}
	else
	{
		data.tasks.splice(taskIndex, 1);
	}

	selectedTask = null;
	updateTasks();
}

function editTask(target)
{

}

function completeSelected(target)
{
	// Does the task exist in the tasks list?
	taskIndex = data.tasks.indexOf(target);

	if (taskIndex >= 0)
	{
		data.completed.push(target);
		data.tasks.splice(taskIndex, 1);
	}

	// Redraw
	updateTasks();
}

function revertSelected(target)
{
	// Does the task exist in the completed list?
	taskIndex = data.completed.indexOf(target);

	if (taskIndex >= 0)
	{
		data.tasks.push(target);
		data.completed.splice(taskIndex, 1);
	}

	// Redraw
	updateTasks();
}

function updateSettings()
{
	// Grab data from the controls.
	playSound = $('#playAlertControl').is(":checked");
	totalPhraseTime = $('#phraseLengthControl option:selected').val();
	totalBlockTime = $('#blockLengthControl option:selected').val();

	// Store data locally.
	localStorage.setItem("playSound", playSound);
	localStorage.setItem("phraseLength", totalPhraseTime);
	localStorage.setItem("blockLength", totalBlockTime);
}

function loadSettings()
{
	var localPlaySound = localStorage.getItem("playSound");
	var localPhraseLength = localStorage.getItem("phraseLength");
	var localBlockLength = localStorage.getItem("blockLength");

	if (localPlaySound != null) { playSound = localPlaySound; }
	if (localPhraseLength != null) { totalPhraseTime = localPhraseLength; }
	if (localBlockLength != null) { totalBlockTime = localBlockLength; }

	// Update settings on controls.
	$('#playAlertControl').prop('checked', playSound);
	$('#phraseLengthControl').val(totalPhraseTime);
	$('#blockLengthControl').val(totalBlockTime);
}

function initializeTutorial()
{
	// Tutorial steps
	$('#newTaskButton').popover({placement: "bottom", content:"Add a new task to get started!"});
	$('#confirmTaskButton').popover({placement: "bottom", content:"Enter a name for your task and create that bad boy."});
	$('#timerButton').popover({placement: "bottom", content:"Once you've finished creating tasks, begin your first phrase and start working!"});
	
	// Set actions to show the tutorial steps.
	$('#newTaskButton').popover('show');
	$('#taskModal').on("shown.bs.modal", function() { $('#confirmTaskButton').popover('show'); });
	$('#taskModal').on("hidden.bs.modal", function() { $('#timerButton').popover('show'); });

	// Set actions to destroy the tutorial steps.
	$('#newTaskButton').one("click", function() { $('#newTaskButton').popover('destroy'); });
	$('#taskModal').one("hide.bs.modal", function() { $('#confirmTaskButton').popover('destroy'); });
	$('#timerButton').one("click", function() { $('#timerButton').popover('destroy'); });
}

function updateTasks()
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
	else
	{
		// Mark task as active.
		$('#taskList .current-task').removeClass("current-task");
		$('#taskList a:nth-child('+(currentTaskIndex + 1)+')').addClass("current-task");
	}

	// Update add task button based on task queue.
	if (data.tasks.length + data.completed.length == 0)
	{
		$('#newTaskButton').addClass("btn-primary");
		$('#newTaskButton').removeClass("btn-default");
	}
	else
	{
		$('#newTaskButton').addClass("btn-default");
		$('#newTaskButton').removeClass("btn-primary");
	}

	// Update active tasks count
	$('#taskCountBadge').html(data.tasks.length);

	// Remove task management events.
	$('#completeSelectedButton').unbind("click");
	$('#editSelectedButton').unbind("click");
	$('#deleteSelectedButton').unbind("click");

	// Set visuals and events.
	if (selectedTask != null)
	{
		// Is the selected task complete?
		if (data.tasks.indexOf(selectedTask) >= 0)
		{
			$('#completeSelectedButton').html("<i class=\"fa fa-check-square-o\"></i> Complete");
			$('#completeSelectedButton').click(function() {completeSelected(selectedTask);});
			$('#completeSelectedButton').addClass("btn-success");
			$('#completeSelectedButton').removeClass("btn-warning");
			$('#completeSelectedButton').removeClass("btn-default");
		}
		else
		{
			$('#completeSelectedButton').html("<i class=\"fa fa-square-o\"></i> Revert");
			$('#completeSelectedButton').click(function() {revertSelected(selectedTask);});
			$('#completeSelectedButton').addClass("btn-warning");
			$('#completeSelectedButton').removeClass("btn-success");
			$('#completeSelectedButton').removeClass("btn-default");
		}

		$('#editSelectedButton').click(function() {editTask(selectedTask);});

		$('#deleteSelectedButton').click(function() {deleteTask(selectedTask);});
		$('#deleteSelectedButton').addClass("btn-danger");
		$('#deleteSelectedButton').removeClass("btn-default");

		// Enable the buttons.
		$('#completeSelectedButton').removeClass("disabled");
		$('#editSelectedButton').removeClass("disabled");
		$('#deleteSelectedButton').removeClass("disabled");
	}
	else
	{
		$('#deleteSelectedButton').removeClass("btn-danger");
		$('#completeSelectedButton').removeClass("btn-success");
		$('#completeSelectedButton').removeClass("btn-warning");
		$('#completeSelectedButton').html("<i class=\"fa fa-check-square-o\"></i> Complete");

		// Disable the buttons.
		$('#completeSelectedButton').addClass("disabled");
		$('#editSelectedButton').addClass("disabled");
		$('#deleteSelectedButton').addClass("disabled");
		$('#completeSelectedButton').addClass("btn-default");
		$('#deleteSelectedButton').addClass("btn-default");
	}
}

// Initial setup.
loadSettings();
updateTasks();
if (data.tasks.length == 0 && data.completed.length == 0) { initializeTutorial(); }

