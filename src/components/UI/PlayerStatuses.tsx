import React from 'react'
import { clamp } from 'lodash'

import { AsyncParser } from '@components/Analyse/Data/AsyncParser'
import { CachedPlayer } from '@components/Analyse/Data/PlayerCache'
import { ClassIcon } from '@components/UI/ClassIcon'

import { ACTOR_TEAM_COLORS } from '@constants/mappings'
import { sortPlayersByClassId, parseClassHealth } from '@utils/players'

//
// ─── PLAYER STATUSES ────────────────────────────────────────────────────────────
//

export interface PlayerStatusesProps {
  parser: AsyncParser
  tick: number
}

export const PlayerStatuses = (props: PlayerStatusesProps) => {
  const { parser, tick } = props

  const playersThisTick = parser
    ? parser.getPlayersAtTick(tick).filter(({ connected }) => connected)
    : []

  const bluePlayers = []
  const redPlayers = []

  for (const player of playersThisTick) {
    if (player.team === 'blue') bluePlayers.push(player)
    if (player.team === 'red') redPlayers.push(player)
  }

  const blueMedics = bluePlayers.filter(({ classId }) => classId === 5)
  const redMedics = redPlayers.filter(({ classId }) => classId === 5)

  return (
    <>
      <div className="panel blue">
        {bluePlayers.sort(sortPlayersByClassId).map((player, index) => (
          <StatusItem
            key={`blue-player-status-item-${index}`}
            type="player"
            player={player}
            team="blue"
            alignment="left"
          />
        ))}

        {blueMedics.length > 0 ? <div className="separator" /> : null}

        {blueMedics.map((player, index) => (
          <StatusItem
            key={`blue-uber-status-item-${index}`}
            type="uber"
            player={player}
            team="blue"
            alignment="left"
          />
        ))}
      </div>

      <div className="panel red">
        {redPlayers.sort(sortPlayersByClassId).map((player, index) => (
          <StatusItem
            key={`red-player-status-item-${index}`}
            type="player"
            player={player}
            team="red"
            alignment="right"
          />
        ))}

        {redMedics.length > 0 ? <div className="separator" /> : null}

        {redMedics.map((player, index) => (
          <StatusItem
            key={`red-uber-status-item-${index}`}
            type="uber"
            player={player}
            team="red"
            alignment="right"
          />
        ))}
      </div>

      <style jsx>{`
        .panel {
          position: absolute;
          display: flex;
          flex-flow: column nowrap;
          font-family: monospace;
          font-size: 1rem;

          &.blue {
            left: 0;
            align-items: flex-start;
          }

          &.red {
            right: 0;
            align-items: flex-end;
          }

          .separator {
            height: 0.5rem;
          }
        }
      `}</style>
    </>
  )
}

//
// ─── STATUS ITEM ────────────────────────────────────────────────────────────────
//

const STATUS_ITEM_WIDTH = '12rem'
const STATUS_ITEM_HEIGHT = '2rem'

export interface StatusItemProps {
  player: CachedPlayer
  type: 'player' | 'uber'
  team: 'blue' | 'red'
  alignment: 'left' | 'right'
}

export const StatusItem = (props: StatusItemProps) => {
  const { player, type, team, alignment } = props
  let name, health, percentage, healthCls, icon

  switch (type) {
    case 'player':
      name = player.user.name
      health = player.health
      percentage = parseClassHealth(player.classId, health).percentage
      healthCls = percentage > 100 ? 'overhealed' : percentage < 40 ? 'low' : ''
      icon = <ClassIcon classId={player.classId} />
      break

    case 'uber':
      name = 'Charge' // TODO: display medi gun type (requires additional parsing)
      health = player.chargeLevel || 0
      percentage = player.chargeLevel || 0
      break
  }

  return (
    <>
      <div className={`player-status-item align-${alignment}`}>
        {icon && <div className="class-icon-container">{icon}</div>}

        <div className="details-container">
          {/* Note: fill & overheal widths are manipulated inline for better performance,
            because changing the value in css class directly will continously trigger
            styled-jsx recalculation / DOM reflow (very costly over time)
            https://github.com/vercel/styled-jsx#via-inline-style */}
          <div className="fill" style={{ width: `${percentage}%` }}></div>
          <div className="overheal" style={{ width: `${clamp(percentage - 100, 0, 100)}%` }}></div>
          <div className="name">{name}</div>
          <div className="spacer"></div>
          <div className={`health ${healthCls}`}>{health}</div>
          <div className="respawn-timer"></div>
        </div>
      </div>

      <style jsx>{`
        .player-status-item {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.7);
          margin-bottom: 1px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: bold;
          width: ${STATUS_ITEM_WIDTH};
          height: ${STATUS_ITEM_HEIGHT};

          .class-icon-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            width: ${STATUS_ITEM_HEIGHT};
            height: ${STATUS_ITEM_HEIGHT};
            background: rgba(0, 0, 0, 0.2);
          }

          .details-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            height: 100%;
            overflow: hidden;

            .fill {
              position: absolute;
              height: 100%;
              background: ${ACTOR_TEAM_COLORS(team).healthBar};
            }

            .overheal {
              position: absolute;
              height: 100%;
              background: rgba(255, 255, 255, 0.4);
            }

            .name {
              position: relative;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              padding: 0 0.3rem;
            }

            .spacer {
              flex: 1;
            }

            .health {
              position: relative;
              color: #ffffff;
              font-weight: bold;
              padding: 0 0.3rem;

              &.overhealed {
                color: ${ACTOR_TEAM_COLORS(team).healthOverhealed};
              }

              &.low {
                color: ${ACTOR_TEAM_COLORS(team).healthLow};
              }
            }
          }

          &.align-left {
            flex-flow: row nowrap;

            .details-container {
              flex-flow: row nowrap;
            }

            .fill {
              left: 0;
            }
          }

          &.align-right {
            flex-flow: row-reverse nowrap;

            .details-container {
              flex-flow: row-reverse nowrap;
            }

            .fill {
              right: 0;
            }
          }
        }
      `}</style>
    </>
  )
}
