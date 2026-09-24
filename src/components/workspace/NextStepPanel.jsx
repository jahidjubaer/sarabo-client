import { CircleCheckBig, CircleX, Clock3, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const TONES = {
    // The viewer must act: the only panel with the Marigold rail, and it holds
    // the real control (the quote decision, the payment, the receipt confirm).
    action: { wrap: 'border-l-4 border-l-ds-action', eyebrow: 'text-ds-attention-subtle-foreground', Icon: Sparkles, icon: 'bg-ds-attention-subtle text-ds-attention-subtle-foreground' },
    waiting: { wrap: '', eyebrow: 'text-ds-muted-foreground', Icon: Clock3, icon: 'bg-ds-waiting-subtle text-ds-waiting-subtle-foreground' },
    done: { wrap: '', eyebrow: 'text-ds-success-subtle-foreground', Icon: CircleCheckBig, icon: 'bg-ds-success-subtle text-ds-success-subtle-foreground' },
    closed: { wrap: '', eyebrow: 'text-ds-muted-foreground', Icon: CircleX, icon: 'bg-ds-neutral-subtle text-ds-neutral-subtle-foreground' },
};

// "Your next step" - the top of every repair workspace. With tone="action" it
// wraps the live section component (so approving, paying or confirming happens
// right here, not after a jump down the page); otherwise it states plainly
// what is happening and who it is waiting on.
function NextStepPanel({ tone = 'waiting', eyebrow, title, description, children, id = 'next-step' }) {
    const style = TONES[tone] || TONES.waiting;
    const Icon = style.Icon;
    const headingId = `${id}-heading`;

    return (
        <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-24 rounded-ds-lg border border-ds-border bg-ds-card p-5 sm:p-6', style.wrap)}>
            <div className="flex items-start gap-4">
                <span className={cn('hidden size-11 shrink-0 items-center justify-center rounded-full sm:flex', style.icon)}>
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    {eyebrow ? <p className={cn('text-body-sm font-bold', style.eyebrow)}>{eyebrow}</p> : null}
                    <h2 id={headingId} className="mt-0.5 text-heading text-ds-foreground">{title}</h2>
                    {description ? <p className="mt-1 max-w-2xl text-body-sm text-ds-muted-foreground">{description}</p> : null}
                    {children ? <div className="mt-5">{children}</div> : null}
                </div>
            </div>
        </section>
    );
}

export { NextStepPanel };
