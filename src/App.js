import React, { useState } from "react";
import AceEditor from "react-ace";
import "./App.css";

import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-terminal";

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
    newDate.setFullYear(year);
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
    return []
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
  let userPriority = {}
  let chosenUsers = {}
  let definedDates = Object.keys(usersByDates).sort();
  let minDate = definedDates[0];
  let maxDate = definedDates[definedDates.length - 1];
  let allDates = _expandDateRange(minDate, maxDate);
  for(let dt of allDates) {
    chosenUsers[dt] = null;
  }
  for(let dt of definedDates) {
    let dateUsers = usersByDates[dt];
    let minUser = null;
    for(let user of dateUsers) {
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
  for(let dt of Object.keys(chosenUsers).sort()) {
    outputLines.push(
      dt + ": " + (chosenUsers[dt] || "UNSPECIFIED")
    )
  }
  return outputLines.join("\n");
}

function App() {
  const [scheduleInput, setScheduleInput] = useState(`\
# Xinli
01-08 to 01-10
01-10 to 01-15
# Ahmad
01-25 to 01-31
# Frank
01-01 to 01-05
01-10 to 01-15
# Karen
01-15 to 01-20
# George
01-20 to 01-25
# Tam
2020-01-06
2020-01-07`);

  let datesByUser = parseDatesByUsers(scheduleInput);
  let usersByDates = parseUsersByDates(datesByUser);
  let chosenUsers = chooseUsersForDates(usersByDates);
  let output = formatChosenUsers(chosenUsers);

  return (
    <div className="App">
      <div className="calendars">
      <h1>Co-op Childcare Scheduler</h1>
        <div className="calendar-row">
          <h2 className="calendar-label">Available Dates</h2>
          <div className="calendar-editor">
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
              onChange={setScheduleInput}
              height="40vh"
            />
          </div>
        </div>
        <div className="calendar-row">
          <h2 className="calendar-label">Assigned Dates</h2>
          <div className="calendar-editor">
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
                showLineNumbers: true,
                tabSize: 2
              }}
              height="40vh"
              readOnly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
