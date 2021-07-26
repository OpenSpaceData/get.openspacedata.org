<script>
	import { range } from './store';
	let startDate, endDate;
</script>

<div class="container">
	<div>
		<label>
			<input
				data-shadow
				type="radio"
				name="timeRange"
				value="latest"
				on:click={() => ($range = { ...$range, type: 'latest' })}
			/>
			<span class="radioInput" />
			Gimme the latest imagery with best quality
		</label>
		<label>
			<input
				data-shadow
				type="radio"
				on:click={() => ($range = { ...$range, type: 'range' })}
				name="timeRange"
				value="range"
			/>
			<span class="radioInput" />
			Let me set the time range myself
		</label>
	</div>
	{#if $range.type === 'range'}
		<!-- content here -->
		<div class="content horizontal">
			<div class="field fromDate">
				<img src="./build/assets/img/calendar.svg" alt="" />
				<input
					data-shadow
					class="locationSearch shadow"
					type="date"
					placeholder="Start date"
					bind:value={startDate}
					on:change={() => ($range = { ...$range, startDate: startDate })}
					on:blur={() => ($range = { ...$range, startDate: startDate })}
				/>
			</div>
			<p class="to">to</p>
			<div class="field toDate">
				<img src="./build/assets/img/calendar.svg" alt="" />
				<input
					data-shadow
					class="locationSearch shadow"
					type="date"
					placeholder="End date"
					bind:value={endDate}
					on:change={() => ($range = { ...$range, endDate: endDate })}
					on:blur={() => ($range = { ...$range, endDate: endDate })}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	div.horizontal {
		display: flex;
		align-items: center;
		justify-content: space-around;
		margin-bottom: 1rem;
	}

	div p.to {
		padding: 0 1rem;
	}

	div.field {
		display: flex;
		align-items: center;
	}

	div.field input {
		font-family: var(--bold-font);
		font-size: var(--size-400);
		height: auto;
		box-sizing: border-box;
		padding: 20px 50px;
		list-style: none;
		border-radius: 15px;
		border: 2px solid #000;
		margin: 15px 0;
	}

	label {
		font-size: var(--size-600);
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	label > .radioInput {
		position: relative;
		height: var(--size-700);
		width: var(--size-700);
		border-radius: 100%;
		border: 2px solid #000;
		box-shadow: var(--shadow-color, var(--color-black)) 1px 2px 0;
	}

	label > input:checked + .radioInput {
		border-color: var(--color-primary);
		--shadow-color: var(--color-primary);
	}

	label > input:checked + .radioInput::before {
		position: absolute;
		top: 0;
		left: 0;
		content: '';
		height: var(--size-600);
		width: var(--size-600);
		border-radius: 100%;
		border: 4px solid #fff;
		background: var(--color-primary);
	}

	label > input[type='radio'] {
		display: none;
	}

	div.field img {
		position: absolute;
		padding: 20px 16px;
	}
</style>
