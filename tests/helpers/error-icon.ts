/** The animated XIcon draws these two strokes (see components/ui/icons/x.tsx). */
const X_PATH_A = 'M18 6 6 18';
const X_PATH_B = 'm6 6 12 12';

export function expectErrorXIcon(container: HTMLElement) {
  expect(container.querySelector(`path[d="${X_PATH_A}"]`)).toBeInTheDocument();
  expect(container.querySelector(`path[d="${X_PATH_B}"]`)).toBeInTheDocument();
}
