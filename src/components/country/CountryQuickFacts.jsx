import { Car, Clock, Coins, Landmark, Map, MessageSquare, Phone, Watch } from 'lucide-react';
import { useEffect, useState } from 'react';

function FactCard({ icon, label, value, subtitle = '' }) {
  return (
    <article className="flex h-full min-h-[100px] flex-1 flex-col rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex h-full items-center justify-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sand/45 text-lagoon">
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink break-words">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-ink/55">{subtitle}</p> : null}
        </div>
      </div>
    </article>
  );
}

function formatCurrency(currency) {
  if (!currency?.name && !currency?.symbol) {
    return '';
  }

  if (currency?.name && currency?.symbol) {
    return `${currency.name} (${currency.symbol})`;
  }

  return currency?.name || currency?.symbol || '';
}

function formatTimezones(timezones) {
  if (!Array.isArray(timezones) || timezones.length === 0) {
    return '';
  }

  if (timezones.length > 2) {
    return 'Multiple';
  }

  return timezones.join(', ');
}

function getLocalTimeForOffset(utcOffset) {
  if (typeof utcOffset !== 'string') {
    return '';
  }

  const normalizedOffset = utcOffset.trim().toUpperCase();
  const match = normalizedOffset.match(/^UTC([+-])(\d{2}):(\d{2})$/);

  if (!match) {
    return '';
  }

  const [, sign, hoursString, minutesString] = match;
  const direction = sign === '+' ? 1 : -1;
  const offsetMinutes = direction * ((Number(hoursString) * 60) + Number(minutesString));
  const now = new Date();
  const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const localDate = new Date(utcTimestamp + (offsetMinutes * 60 * 1000));

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(localDate);
}

export function CountryQuickFacts({ quickFacts }) {
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    if (!quickFacts?.timezones?.length) {
      setLocalTime('');
      return undefined;
    }

    const primaryTimezone = quickFacts.timezones[0];
    const updateLocalTime = () => {
      setLocalTime(getLocalTimeForOffset(primaryTimezone));
    };

    updateLocalTime();

    const intervalId = window.setInterval(updateLocalTime, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [quickFacts]);

  if (!quickFacts) {
    return null;
  }

  const factItems = [
    quickFacts.capital
      ? {
          label: 'Capital',
          value: quickFacts.capital,
          icon: <Landmark className="h-5 w-5" />,
        }
      : null,
    quickFacts.languages?.length
      ? {
          label: 'Languages',
          value: quickFacts.languages.join(', '),
          icon: <MessageSquare className="h-5 w-5" />,
        }
      : null,
    localTime
      ? {
          label: 'Local time',
          value: localTime,
          subtitle: quickFacts.timezones?.length > 1 ? '(Capital timezone)' : '',
          icon: <Watch className="h-5 w-5" />,
        }
      : null,
    formatTimezones(quickFacts.timezones)
      ? {
          label: 'Timezones',
          value: formatTimezones(quickFacts.timezones),
          icon: <Clock className="h-5 w-5" />,
        }
      : null,
    formatCurrency(quickFacts.currency)
      ? {
          label: 'Currency',
          value: formatCurrency(quickFacts.currency),
          icon: <Coins className="h-5 w-5" />,
        }
      : null,
    quickFacts.drivingSide
      ? {
          label: 'Driving',
          value: quickFacts.drivingSide,
          icon: <Car className="h-5 w-5" />,
        }
      : null,
    quickFacts.idd
      ? {
          label: 'Code',
          value: quickFacts.idd,
          icon: <Phone className="h-5 w-5" />,
        }
      : null,
    {
      label: 'Borders',
      value: quickFacts.borders?.length ? quickFacts.borders.join(', ') : 'None',
      icon: <Map className="h-5 w-5" />,
    },
    quickFacts.flagUrl
      ? {
          label: 'Flag',
          value: 'National flag',
          icon: (
            <img
              alt="Country flag"
              className="h-6 w-8 rounded-md border border-gray-200 object-cover"
              src={quickFacts.flagUrl}
            />
          ),
        }
      : null,
  ].filter(Boolean);

  if (!factItems.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Quick facts</p>
        <h2 className="mt-3 text-2xl font-semibold text-ink">At-a-glance country details</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 items-stretch md:grid-cols-3 lg:grid-cols-6">
        {factItems.map((item) => (
          <div key={item.label} className="flex h-full">
            <FactCard icon={item.icon} label={item.label} subtitle={item.subtitle} value={item.value} />
          </div>
        ))}
      </div>
    </section>
  );
}
