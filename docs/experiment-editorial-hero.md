# Editorial hero experiment

The `experiment` block demonstrates an author-controlled A/B comparison without
requiring a licensed experimentation service. Authors provide two rows named
`Control` and `Challenger`; the block selects one variant consistently for the
browser session and emits view and conversion events.

## Hypothesis

A benefit-led call to action will increase visits from the newsroom introduction
to detailed engineering stories compared with a general exploration message.

## Success measure

The primary measure is `experiment.conversion` divided by `experiment.view`,
segmented by variant. Guardrails are page exits, Core Web Vitals, and accessibility
regressions. This local demonstration does not claim statistical significance.

## Production path

For a real campaign, connect the same authored variants and event taxonomy to an
approved AEM experimentation or Adobe Target implementation, document allocation
and exclusion rules, run an agreed sample-size calculation, and retain the result
with the content decision record.
