import React, { useState } from "react";
import AceEditor from "react-ace";
import "./App.css";

import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-terminal";

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function _getDateString(newDate) {
  let dateString = new Date(
    newDate.getTime() - newDate.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];
  return dateString;
}

function _expandDateRange(startDate, endDate) {
  let year = new Date().getFullYear();
  let oneDay = 1000 * 60 * 60 * 24;
  let numDays = (new Date(endDate) - new Date(startDate)) / oneDay;
  let foundDates = [];
  for (let i = 0; i <= numDays; i++) {
    let newDate = new Date(startDate.valueOf());
    newDate.setDate(newDate.getDate() + i);
    if(newDate.getFullYear() < year) {
      newDate.setFullYear(year);
    }
    foundDates.push(_getDateString(newDate));
  }
  return foundDates;
}

function _parseDateRange(dateRange) {
  let startDate = dateRange[0];
  let endDate = dateRange[1];
  return _expandDateRange(startDate, endDate);
}

function parseDateLine(dateLine) {
  let dateRange = dateLine.split(" to ");
  if (dateRange.length >= 2) {
    return _parseDateRange(dateRange);
  } else if (dateLine.trim() === "") {
    return [];
  }
  try {
    return [_getDateString(new Date(dateLine))];
  } catch (e) {
    return [];
  }
}

function parseDatesByUsers(rawInput) {
  let dates_by_user = {};
  let current_user = null;
  let allDates = new Set();
  for (let l of rawInput.split("\n")) {
    if (l.trim().startsWith("#")) {
      current_user = l.substr(1, l.length).trim();
      continue;
    }
    let currentDates = (dates_by_user[current_user] || []).concat(
      parseDateLine(l)
    );
    for (let cd of currentDates) {
      allDates.add(cd);
    }
    dates_by_user[current_user] = currentDates;
  }

  return dates_by_user;
}

function parseUsersByDates(dates_by_user) {
  let user_by_dates = {};
  for (let user of Object.keys(dates_by_user)) {
    for (let dt of dates_by_user[user]) {
      user_by_dates[dt] = (user_by_dates[dt] || new Set()).add(user);
    }
  }
  return user_by_dates;
}

function chooseUsersForDates(usersByDates) {
  let userPriority = {};
  let chosenUsers = {};
  let definedDates = Object.keys(usersByDates).sort();
  let minDate = definedDates[0];
  let maxDate = definedDates[definedDates.length - 1];
  let allDates = _expandDateRange(minDate, maxDate);
  for (let dt of allDates) {
    chosenUsers[dt] = null;
  }
  for (let dt of definedDates) {
    let dateUsers = usersByDates[dt];
    let minUser = null;
    for (let user of dateUsers) {
      if (minUser === null || userPriority[user] < userPriority[minUser]) {
        minUser = user;
      }
    }
    chosenUsers[dt] = minUser;
    userPriority[minUser] = (userPriority[minUser] || 0) + 1;
  }
  return chosenUsers;
}

function formatChosenUsers(chosenUsers) {
  let outputLines = [];
  for (let dt of Object.keys(chosenUsers).sort()) {
    outputLines.push(dt + "\t" + (chosenUsers[dt] || "UNSPECIFIED"));
  }
  return outputLines.join("\n");
}

function App() {
  const [scheduleInput, setScheduleInput] = useState(`\
# Xinli
2020-01-01
2020-01-03
01-08 to 01-11
01-13 to 01-15
# Ahmad
2020-01-25 to 2020-01-31
# Frank
01-02 to 01-05
01-10 to 01-15
# Karen
01-15 to 01-20
2020-02-01 to 2020-02-10
# George
01-20 to 01-25
# Tam
2020-01-06
2020-01-07
2020-02-01 to 2020-02-10`);

  let datesByUser = parseDatesByUsers(scheduleInput);
  let usersByDates = parseUsersByDates(datesByUser);
  let chosenUsers = chooseUsersForDates(usersByDates);
  let output = formatChosenUsers(chosenUsers);

  const InputEditor = (
    <AceEditor
      placeholder="Placeholder Text"
      mode="markdown"
      theme="terminal"
      name="blah2"
      fontSize={14}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      value={scheduleInput}
      setOptions={{
        showLineNumbers: true,
        tabSize: 2
      }}
      onChange={debounce((newInput) => setScheduleInput(newInput), 500)}
      height="40vh"
    />
  );
  const OutputEditor = (
    <AceEditor
      mode="markdown"
      theme="terminal"
      name="blah2"
      fontSize={14}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      value={output}
      setOptions={{
        showLineNumbers: false,
        tabSize: 2
      }}
      height="40vh"
      readOnly={true}
    />
  );

  const InstructionEditor = (
    <AceEditor
      mode="markdown"
      theme="terminal"
      name="blah2"
      fontSize={14}
      showPrintMargin={true}
      showGutter={false}
      highlightActiveLine={true}
      value={`\
  Input the dates that you are available underneath "Available Dates".
  Dates you are assigned to work will be available in the output.
`}
      setOptions={{
        showLineNumbers: false,
        tabSize: 2
      }}
      height="80vh"
      readOnly={true}
      wrapEnabled={true}
    />
  );

  return (
    <div className="App">
      <h1>Co-op Childcare Scheduler</h1>
      <div className="calendars">
        <div className="calendar-io">
          <div className="calendar-row">
            <div className="calendar-pair">
              <h2 className="calendar-label">Available Dates</h2>
              <div className="calendar-editor">{InputEditor}</div>
            </div>
          </div>
          <div className="calendar-row">
            <div className="calendar-pair">
              <h2 className="calendar-label">Assignment</h2>
              <div className="calendar-editor">{OutputEditor}</div>
            </div>
          </div>
        <div className="calendar-row">Written by:&nbsp;<a href="https://github.com/tamsanh/">@tamsanh</a></div>
        </div>
        {/* <div className="calendar-instruction">
          <h2>Instructions</h2>
            {InstructionEditor}
        </div> */}
      </div>
    </div>
  );
}

export default App;
