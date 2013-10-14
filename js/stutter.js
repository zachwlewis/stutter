var source   = $("#task-template").html();
var template = Handlebars.compile(source);
var data = { tasks: []};

$( "#confirmTaskButton" ).click(createTask);
$("#taskModal").on("shown.bs.modal", function() {$("#taskName").focus();});
$("#taskModal").on("hidden.bs.modal", clearTaskModal)

function createTask()
{
	var taskName = $("#taskName").val();
	var taskDescription = $("#taskDescription").val();
	var newTask = {name: taskName, description: taskDescription};
	data.tasks.push(newTask);
	$("#task-placeholder").html(template(data));
	$('#taskModal').modal('hide');
	return false;
}

function clearTaskModal()
{
	$("#taskName").val("");
	$("#taskDescription").val("");
	return false;
}

$("#task-placeholder").html(template(data));
