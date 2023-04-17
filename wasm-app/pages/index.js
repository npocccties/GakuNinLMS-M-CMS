import { serverRuntimeConfig } from '@/next.config';
import { useState } from 'react';

let setRoot, getPptx, setConfig;

if (typeof window !== 'undefined') {
  ({ setRoot, getPptx, setConfig } = ppt2video);
}

let dirHandle = null;
let pptx = null;

async function openDirectory() {
  dirHandle = await window.showDirectoryPicker();
  setRoot(dirHandle);
}

async function getPptxList() {
  const ret = [];
  const re = /.(pptx|PPTX)/;
  for await (const dirent of dirHandle.entries()) {
    const match = dirent[0].match(re);
    if (match) {
      ret.push(dirent[0]);
    }
  }
  return ret;
}

async function openPptx(filename) {
  pptx = await getPptx(filename);
  await pptx.init();
  pptx.zipControl('start');
}

async function createImportJson() {
  const option = {
    importJsonOnly: true,
  };
  await pptx.process(option);
}

const states = {
  init: 1,
  running: 2,
  success: 3,
  error: 4,
};

let topicList = null;
let runningCount = 0;
const runningChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function getTopicList() {
  const list = [];
  for (const section of pptx.sections) {
    list.push({
      name: section.topics[0].name,
      state: states.init,
    });
  }
  topicList = list;
  return curTopicState();
}

function topicState(i, state) {
  if (i < 0) {
    for (const e of topicList) {
      if (e.state === states.running) {
        e.state = states.error;
      }
    }
  } else {
    topicList[i].state = state;
  }
}

function curTopicState() {
  return topicList.map((topic, index) => {
    let pre;
    switch(topic.state) {
      case states.init:    pre = '';break;
      case states.running: pre = runningChars[runningCount] + ' ';break;
      case states.success: pre = '✓ ';break;
      case states.error:   pre = 'エラー!! ';break;
    }
    runningCount++;
    if (runningCount >= runningChars.length) {
      runningCount = 0;
    }
    return pre + topic.name;
  });
}

async function oneTopic(num) {
  const targetTopic = pptx.sections[num].topics[0];
  const option = {
    videoOnly: true,
    targetTopic,
  };
  await pptx.process(option);
}

async function flushZip() {
  await pptx.zipControl('flush');
}

const steps = {
  step1: 1,
  step2: 2,
  step3: 3,
  step35: 4,
  step4: 5,
};

function Message(props) {
  if (props.msg) {
    return (
      <div>
        <br/>
        <textarea readOnly="readonly" rows="5" cols="80" defaultValue={props.msg}></textarea>
      </div>
    );
  }
  return null;
}

function App() {
  const [step, setStep] = useState(steps.step1);
  const [pptxList, setPptxList] = useState([]);
  const [topicList, setTopicList] = useState([]);
  const [filename, setFilename] = useState(null);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);
  const [error3, setError3] = useState(null);
  const [error4, setError4] = useState(null);

  async function handleStep1OpenDirectory() {
    try {
      setError1(null);
      await openDirectory();
      readDirectory();
    } catch(e) {
      setError1('ディレクトリを開くことができませんでした。\n' + e.message);
    }
  }

  async function readDirectory() {
    const list = await getPptxList();
    setPptxList(list);
    setStep(steps.step2);
  }

  function handleFilename(e) {
    setFilename(e.target.value);
  }

  async function readPptx() {
      await openPptx(filename);
      return getTopicList();
  }

  async function handleStep2Next() {
    try {
      setError2(null);
      const list = await readPptx();
      setTopicList(list);
      setStep(steps.step3);
    } catch(e) {
      setError2(e.toString());
    }
  }

  async function handleStep2Reload() {
    setError2(null);
    readDirectory();
  }

  function updateTopicList() {
    const list = curTopicState();
    setTopicList(list);
  }

  function timerFunction() {
    updateTopicList();
  }

  function finalTopicList(timerId) {
    clearInterval(timerId);
    topicState(-1, null);
    updateTopicList();
  }

  async function handleStep3Start() {
    if (error3 !== null) {
      try {
        const list = await readPptx();
        setTopicList(list);
      } catch(e){
        setError3(e.message);
        return;
      }
    }

    const numTopics = getTopicList().length;
    let timerId;

    try {
      setError3(null);
      setStep(steps.step35);
      await createImportJson();
      timerId = setInterval(timerFunction, 100);
      for (let i = 0; i < numTopics; i++) {
        topicState(i, states.running);
        await oneTopic(i);
        topicState(i, states.success);
      }
      finalTopicList(timerId);
      setStep(steps.step4);
    } catch(e){
      finalTopicList(timerId);
      setError3(e.message);
      setStep(steps.step3);
    }
  }

  async function handleStep3Cancel() {
    setTopicList([]);
    setError3(null);
    readDirectory();
  }

  async function handleStep4Save() {
    try {
      setError4(null);
      await flushZip();
      setPptxList([]);
      setFilename(null);
      setTopicList([]);
      readDirectory();
    } catch(e){
      setError4('zipファイルの保存に失敗しました。\n' + e.message);
    }
  }

  return (
    <div>
      <h2> step1: パワーポイントファイルを含むディレクトリを開きます。</h2>
      <button onClick={handleStep1OpenDirectory} disabled={step !== steps.step1}>ディレクトリを開く</button>
      <Message msg={error1} />
      <h2> step2: パワーポイントファイルを選択します。</h2>
      <form>
        {pptxList.map((filename, index) =>
          <div key={index}>
            <input type="radio" name="pptx" value={filename} onClick={handleFilename} /> {filename}
          </div>
        )}
      </form>
      <button onClick={handleStep2Next} disabled={step !== steps.step2 || filename === null}>次へ</button>
      &emsp;
      <button onClick={handleStep2Reload} disabled={step !== steps.step2}>更新</button>
      <Message msg={error2} />
      <h2> step3: Import JSONファイル及び各トピックのビデオファイルを作成します。</h2>
      {topicList.map((topicname, index) =>
        <p key={index}>{topicname}</p>
      )}
      <button onClick={handleStep3Start} disabled={step !== steps.step3}>開始</button>
      &emsp;
      <button onClick={handleStep3Cancel} disabled={step !== steps.step3}>キャンセル</button>
      <Message msg={error3} />
      <h2> step4: zipファイルを保存します。</h2>
      <button onClick={handleStep4Save} disabled={step !== steps.step4}>保存</button>
      <Message msg={error4} />
    </div>
  )
}

export default App;
