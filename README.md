# VGS
Voice Game System

```sh
npm install @wilderzone/vgs

# or

deno add @wilderzone/vgs
```


## Usage

Create and configure a VGS instance.
```ts
import { VGS, type VGSConfig, type VGSMatch } from '@wilderzone/vgs';
import { data } from './your/data';

// Configure VGS.
const config: VGSConfig = {
	trigger: 'V',
	timeout: 3000,
	options: data
};

// Create a new VGS instance.
const vgs = new VGS(config);
```

Connect callbacks with `.on`.
```ts
import { onCancel, onOptions, onMatch } from './your/logic';

vgs.on('cancel', onCancel);
vgs.on('options', onOptions);
vgs.on('match', onMatch);
```

Then send keypresses to the system with `.press`.
```ts
vgs.press('V');
vgs.press('G');
vgs.press('W');
```

When the VGS finds a match, it will call your `'match'` callback so you can play the appropriate voice line.


### Configuration

| Option     | Required | Default    | Description                                                                                                    |
| :--------- | :------- | :--------: | :------------------------------------------------------------------------------------------------------------- |
| `options`  | *        |            | The voice lines to include in the VGS.                                                                         |
| `timeout`  |          | `3000`     | The duration (in ms) to wait for further keypresses before timing out. Set this to `0` to disable the timeout. |
| `trigger`  |          | `"V"`      | The key used to trigger VGS.                                                                                   |
| `cancel`   |          | `"Escape"` | The key used to cancel the current VGS sequence.                                                               |


### Methods

| Method     | Description                                                           |
| :--------- | :-------------------------------------------------------------------- |
| `on`       | Listen to VGS [events](#events).                                      |
| `press`    | Send a keypress to the VGS. Keys are case insensitive.                |
| `cancel`   | Cancel the current VGS sequence.                                      |


### Events

| Event      | Payload      | Description                                                                        |
| :--------- | :----------- | :--------------------------------------------------------------------------------- |
| `trigger`  |              | Fired when a new VGS sequence is started (after a `trigger` keypress is detected). |
| `options`  | `VGSMatch[]` | Fired when the VGS produces the next set of options in the current sequence.       |
| `match`    | `VGSMatch`   | Fired when the sequence matches a single voice line. The sequence is then reset.   |
| `cancel`   |              | Fired when the sequence is cancelled by the `cancel` key or `.cancel()` method.    |
| `timeout`  |              | Fired when the sequence times out.                                                 |
