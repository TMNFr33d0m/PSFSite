var shifts = [];

$(document).ready(function(){
    LoadNavBar();

    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="popover"]'))
    
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    })

    // Get references to the list box and the "Remove Shift" button
    var listBox = document.getElementById('shifts'); // replace 'listBoxId' with the actual id of your list box
    var removeShiftButton = document.getElementById('removeShiftButtonId'); // replace 'removeShiftButtonId' with the actual id of your "Remove Shift" button

    // Hide the "Remove Shift" button initially
    removeShiftButton.style.display = 'none';

    // Add an event listener for the 'change' event on the list box
    listBox.addEventListener('change', function() {
        // If a shift is selected, show the "Remove Shift" button, otherwise hide it
        RemoveShiftDeleteButton(removeShiftButton, listBox);
    });

    document.getElementById('buyNowButton').addEventListener('click', function(event) {

        AddButtonEmailAction(event);
    });
        
});

window.onload = function() {
    var data = JSON.parse(localStorage.getItem('formData'));
    if (data) {
        // Populate the form fields with the data
        document.getElementById('firstName').value = data.firstName;
        document.getElementById('lastName').value = data.lastName;
        document.getElementById('company').value = data.company;
        document.getElementById('phoneNumber').value = data.phoneNumber;
        document.getElementById('email').value = data.email;
        document.getElementById('address').value = data.address;
        document.getElementById('startDate').value = data.startDate;
        document.getElementById('dayOfWeek').value = data.dayOfWeek;
        document.getElementById('startTime').value = data.startTime;
        document.getElementById('duration').value = data.duration;
        document.getElementById('total').value = data.total;
        document.getElementById('xtraDutyRequests').value = data.xtraDutyRequests;
        document.getElementById('grandTotal').value = data.grandTotal;
    }
};

function addShift() {
    // Get the values from the form
    var dayOfWeek = document.getElementById('dayOfWeek').value;
    var startTime = document.getElementById('startTime').value;
    var duration = document.getElementById('duration').value;

    // Create a new shift object
    var shift = { dayOfWeek, startTime, duration };

    // Get a reference to the error messages element
    var errorMessages = document.getElementById('errorMessages');
    errorMessages.innerHTML = ''; // Clear any previous error messages

    // Validate the form values
    if (!dayOfWeek) {
        var alert = document.createElement('div');
        alert.className = 'alert alert-danger mt-3';
        alert.textContent = 'Day of week is required.';
        errorMessages.appendChild(alert);
        return;
    }

    if (!startTime) {
        var alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.textContent = 'Start time is required.';
        errorMessages.appendChild(alert);
        return;
    }

    if (!duration) {
        var alert = document.createElement('div');
        alert.className = 'alert alert-danger mt-3';
        alert.textContent = 'Duration is required.';
        errorMessages.appendChild(alert);
        return;
    }

    // Validate the duration
    if (duration < 10 || duration > 60) {
        var alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.textContent = 'Duration must be between 10 and 60 minutes.';
        errorMessages.appendChild(alert);
        return;
    }

    // Check for duplicate shifts
    for (var existingShift of shifts) {
        if (existingShift.dayOfWeek === shift.dayOfWeek &&
            existingShift.startTime === shift.startTime &&
            existingShift.duration === shift.duration) {
            var alert = document.createElement('div');
            alert.className = 'alert alert-danger mt-3';
            alert.textContent = 'This shift already exists.';
            errorMessages.appendChild(alert);
            return;
        }
    }

    // Check for overlapping shifts
    for (var existingShift of shifts) {
        var existingShiftDayNumber = dayOfWeekToNumber(existingShift.dayOfWeek);
        var tempDate = new Date(`1970-01-01T${existingShift.startTime}:00Z`);
        var arizonaTime = tempDate.toLocaleTimeString('en-US', {timeZone: 'America/Phoenix'});
        var timeParts = arizonaTime.split(':');
        var existingShiftStartTime = new Date(1970, 0, 1, timeParts[0], timeParts[1]);
        var existingShiftEndTime = new Date(existingShiftStartTime.getTime() + existingShift.duration * 60000 + 120 * 60000);

        var newShiftDayNumber = dayOfWeekToNumber(dayOfWeek);
        var newShiftTimeInput = document.getElementById('startTime');
        var newShiftTimeValue = newShiftTimeInput.value;
        var tempDate = new Date(`1970-01-01T${newShiftTimeValue}:00Z`);
        var arizonaTime = tempDate.toLocaleTimeString('en-US', {timeZone: 'America/Phoenix'});
        var timeParts = arizonaTime.split(':');
        var newShiftTime = new Date(1970, 0, 1, timeParts[0], timeParts[1]);

        var newShiftEndTime = new Date(newShiftTime.getTime() + duration * 60000);

        if (!existingShift.startTime || !existingShift.duration || !newShiftTime) {
            console.error('One of the required variables is undefined');
            console.log('existingShift.startTime:', existingShift.startTime);
            console.log('existingShift.duration:', existingShift.duration);
            console.log('newShiftTime:', newShiftTime);
            return;
        }

        if (existingShiftDayNumber === newShiftDayNumber &&
            ((newShiftTime >= existingShiftStartTime && newShiftTime < existingShiftEndTime) ||
             (newShiftEndTime > existingShiftStartTime && newShiftEndTime <= existingShiftEndTime) ||
             (newShiftTime <= existingShiftStartTime && newShiftEndTime >= existingShiftEndTime))) {
            var overlap;
            if (newShiftTime < existingShiftStartTime) {
                overlap = (existingShiftStartTime.getTime() - newShiftEndTime.getTime()) / 60000;
            } else {
                overlap = (newShiftTime.getTime() - existingShiftEndTime.getTime()) / 60000;
            }
            var alert = document.createElement('div');
            alert.className = 'alert alert-danger mt-3';
            var adjustment = 120 - Math.abs(overlap);
            alert.textContent = 'There must be at least 2 hours between each window. Please increase the time by at least ' + adjustment + ' minutes.';
            errorMessages.appendChild(alert);
            return;
        }
    }

    // Insert the new shift into the array in the correct position

    var newShiftTime = new Date(`1970-01-01T${startTime}:00Z`);

    var i;
    for (i = 0; i < shifts.length; i++) {
        var shiftDayNumber = dayOfWeekToNumber(shifts[i].dayOfWeek);
        var shiftTime = new Date(`1970-01-01T${shifts[i].startTime}:00Z`);

        if (shiftDayNumber > newShiftDayNumber || (shiftDayNumber === newShiftDayNumber && shiftTime > newShiftTime)) {
            break;
        }
    }

    shifts.splice(i, 0, shift); // insert the new shift into the array

    // <!-- Create 2 hour window --> 
    var startTimeDate = new Date(`1970-01-01T${startTime}:00Z`); // convert to Date object
    startTimeDate.setHours(startTimeDate.getHours() + 2); // add two hours

    var newStartTime = startTimeDate.toISOString().substr(11, 5); // convert back to time string

    // Create the new option
    var shiftsSelect = document.getElementById('shifts');
    var option = document.createElement('option');
    option.text = 'Every ' + dayOfWeek + ', ' + startTime + ' - '+ newStartTime +'(' + duration + ' minutes)';

    // Insert the new option at the correct position
    shiftsSelect.add(option, i);

    calculateTotal();
}

function dayOfWeekToNumber(dayOfWeek) {
    switch (dayOfWeek.toLowerCase()) {
        case 'monday': return 1;
        case 'tuesday': return 2;
        case 'wednesday': return 3;
        case 'thursday': return 4;
        case 'friday': return 5;
        case 'saturday': return 6;
        case 'sunday': return 7;
        default: return 0;
    }
}

function removeShift() {
var shiftsSelect = document.getElementById('shifts');
var selectedIndex = shiftsSelect.selectedIndex;

if (selectedIndex !== -1) {
    shifts.splice(selectedIndex, 1);
    shiftsSelect.remove(selectedIndex);

    calculateTotal();
}
}

function calculateTotal() {

    var total = shifts.reduce((sum, shift) => sum + shift.duration * 2 * 4.33, 0);
    document.getElementById('total').value = "$" + total.toFixed(2);

    var xtraDuty = document.getElementById('xtraDuty').checked;
    var emergencyResponse = document.getElementById('emergencyResponse').checked;

    if (xtraDuty) {
        total += 139.99;
        document.getElementById('xtraDutyRequests').style.display = 'block';
    } else {
        document.getElementById('xtraDutyRequests').style.display = 'none';
    }

    if (emergencyResponse) {
        total += 59.99;
        document.getElementById('emergencyMessage').style.display = 'block';
    } else {
        document.getElementById('emergencyMessage').style.display = 'none';
    }

    document.getElementById('grandTotal').value = "$" + total.toFixed(2);
}

function getFormData() {
    var form = document.getElementById('serviceForm');
    var formData = new FormData(form);
    var data = {};

    // Get values from form
    for (var pair of formData.entries()) {
        data[pair[0]] = pair[1];
    }

    // Get values from checkboxes
    data.xtraDuty = document.getElementById('xtraDuty').checked;
    data.emergencyResponse = document.getElementById('emergencyResponse').checked;

    // Get value from shifts select
    var shiftsSelect = document.getElementById('shifts');
    data.shifts = Array.from(shiftsSelect.options).map(option => option.value);

    // Get phone number and email
    data.phoneNumber = document.getElementById('phoneNumber').value;
    data.email = document.getElementById('email').value;

    return data;       
}

function RemoveShiftDeleteButton(removeShiftButton, listBox) {
    removeShiftButton.style.display = listBox.selectedIndex >= 0 ? 'inline' : 'none';
}

function AddButtonEmailAction(event) {
    event.preventDefault();
    var data = getFormData();
    console.log(data); // log the data to the console for debugging


    // Save the data to localStorage
    localStorage.setItem('formData', JSON.stringify(data));

    // Prepare the data for the AJAX call
    var payload = {
        from: 'Patrol Automated Sales <robocop@privateersecurity.com>',
        to: 'communication@privateersecurity.com',
        subject: 'Sales Request from ' + data.firstName + ' ' + data.lastName,
        text: data.firstName + ' ' + data.lastName + ' (Company: ' + data.company + ') has requested the following patrol services: <br /> ' + data.shifts.join(', <br /> ') + ' <br /> <br />  Beginning on ' + data.startDate + ' at ' + data.address + ' for a total of ' + data.total + ' per month. <br /> <br /> ' + 'X-Tra Duty: ' + data.xtraDuty + '\r \n <br /> ' + 'Emergency Response: ' + data.emergencyResponse + '<br /> <br /> ' + 'Additional Requests: ' + data.xtraDutyRequests + '<br /> <br /> ' + 'Grand Total: ' + data.grandTotal + '<br /> <br /> ' + 'Phone Number: ' + data.phoneNumber + '<br /> <br /> ' + 'Email: ' + data.email,
        html: '<html>' + data.firstName + ' ' + data.lastName + ' (Company: ' + data.company + ') has requested the following patrol services: <br /> ' + data.shifts.join(', <br /> ') + ' <br /> <br /> Beginning on ' + data.startDate + ' at ' + data.address + ' for a total of ' + data.total + ' per month. <br /> <br /> ' + 'X-Tra Duty: ' + data.xtraDuty + '\r \n <br /> ' + 'Emergency Response: ' + data.emergencyResponse + '<br /> <br /> ' + 'Additional Requests: ' + data.xtraDutyRequests + '<br /> <br /> ' + 'Grand Total: ' + data.grandTotal + '<br /> <br /> ' + 'Phone Number: ' + data.phoneNumber + '<br /> <br /> ' + 'Email: ' + data.email + '</html>'
    };

    // Make the AJAX call
    $.ajax({
        // url: 'https://localhost:44380/Sales/ReceivePayload', // Use this URL for local testing
        url: 'https://fullsailclientfrontend20220119172206.azurewebsites.net/Sales/ReceivePayload',
        type: 'POST',
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            console.log('Request sent successfully');
            window.location.href = 'confirmation.html'; // Redirect to the confirmation page
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error sending request:', errorThrown);
        }
    });
}

