import isOnline from 'is-online';
import {distinctUntilChanged, filter, mergeMap, share} from "rxjs/operators";
import {from, interval, Subject} from "rxjs";
import path from "path";
import {JSONFile, Low} from "lowdb";
import {DownLog} from "./down-log.model.js";


const initializeDb = async () => {
  const file = path.join(path.resolve(path.dirname('')), 'db.json');
  const adapter = new JSONFile(file);
  const db = new Low(adapter);

  await db.read()
  db.data = db.data || {log: []}
  return db;
}

const MINIMAL_OUTAGE_TIME = 1000;
const db = await initializeDb();
const dbAccessSubject$ = new Subject();
const ticker$ = interval(500);
let currentDownLog = undefined;


const hazConnectionChanged$ = ticker$.pipe(
  mergeMap(() => from(isOnline())),
  distinctUntilChanged(),
  share(),
);

const hazConnectionGoneDown$ = hazConnectionChanged$.pipe(filter(conStatus => !conStatus));
const hazConnectionGoneUp$ = hazConnectionChanged$.pipe(filter(conStatus => conStatus));

hazConnectionGoneDown$.subscribe(() => {
  if (currentDownLog) {
    return;
  }
  currentDownLog = new DownLog();
});

hazConnectionGoneUp$.subscribe(() => {
  if (!currentDownLog) {
    return;
  }
  currentDownLog.finish();
  if (currentDownLog.duration >= MINIMAL_OUTAGE_TIME) {

    db.data.log.push(currentDownLog);
    dbAccessSubject$.next(currentDownLog);
  }

  currentDownLog = undefined;
});

dbAccessSubject$.subscribe(async () => {
  await db.write();
})





