var GetFastValue = Phaser.Utils.Objects.GetFastValue;

// prettier-ignore
export function patchPhaser() {
    Phaser.Textures.Parsers.SpriteSheetFromAtlas = function(texture, frame, config)
    {
        var frameWidth = GetFastValue(config, 'frameWidth', null);
        var frameHeight = GetFastValue(config, 'frameHeight', frameWidth);
    
        //  If missing we can't proceed
        if (!frameWidth)
        {
            throw new Error('TextureManager.SpriteSheetFromAtlas: Invalid frameWidth given.');
        }
    
        //  Add in a __BASE entry (for the entire atlas)
        var source = texture.source[0];
        texture.add('__BASE', 0, 0, 0, source.width, source.height);
    
        var startFrame = GetFastValue(config, 'startFrame', 0);
        var endFrame = GetFastValue(config, 'endFrame', -1);
        var margin = GetFastValue(config, 'margin', 0);
        var spacing = GetFastValue(config, 'spacing', 0);
    
        var x = frame.cutX;
        var y = frame.cutY;
    
        var cutWidth = frame.cutWidth;
        var cutHeight = frame.cutHeight;
        var sheetWidth = frame.realWidth;
        var sheetHeight = frame.realHeight;
    
        var row = Math.floor((sheetWidth - margin + spacing) / (frameWidth + spacing));
        var column = Math.floor((sheetHeight - margin + spacing) / (frameHeight + spacing));
        var total = row * column;
    
        //  trim offsets
    
        var leftPad = frame.x;
        var leftWidth = frameWidth - leftPad;
    
        var rightWidth = frameWidth - ((sheetWidth - cutWidth) - leftPad);
    
        var topPad = frame.y;
        var topHeight = frameHeight - topPad;
    
        var bottomHeight = frameHeight - ((sheetHeight - cutHeight) - topPad);
    
        if (startFrame > total || startFrame < -total)
        {
            startFrame = 0;
        }
    
        if (startFrame < 0)
        {
            //  Allow negative skipframes.
            startFrame = total + startFrame;
        }
    
        if (endFrame !== -1)
        {
            total = startFrame + (endFrame + 1);
        }
    
        var sheetFrame;
        var frameX = margin;
        var frameY = margin;
        var frameIndex = 0;
    
        for (var sheetY = 0; sheetY < column; sheetY++)
        {
            var topRow = (sheetY === 0);
            var bottomRow = (sheetY === column - 1);
    
            for (var sheetX = 0; sheetX < row; sheetX++)
            {
                var leftRow = (sheetX === 0);
                var rightRow = (sheetX === row - 1);
    
                sheetFrame = texture.add(frameIndex, 0, x + frameX, y + frameY, frameWidth, frameHeight);
    
                if (leftRow || topRow || rightRow || bottomRow)
                {
                    var destX = (leftRow) ? leftPad : 0;
                    var destY = (topRow) ? topPad : 0;
    
                    var trimWidth = 0;
                    var trimHeight = 0;
    
                    if (leftRow)
                    {
                        trimWidth += (frameWidth - leftWidth);
                    }
    
                    if (rightRow)
                    {
                        trimWidth += (frameWidth - rightWidth);
                    }
    
                    if (topRow)
                    {
                        trimHeight += (frameHeight - topHeight);
                    }
    
                    if (bottomRow)
                    {
                        trimHeight += (frameHeight - bottomHeight);
                    }
    
                    var destWidth = frameWidth - trimWidth;
                    var destHeight = frameHeight - trimHeight;
    
                    sheetFrame.cutWidth = destWidth;
                    sheetFrame.cutHeight = destHeight;
    
                    sheetFrame.setTrim(frameWidth, frameHeight, destX, destY, destWidth, destHeight);
                }
    
                frameX += spacing;
    
                if (leftRow)
                {
                    frameX += leftWidth;
                }
                else if (rightRow)
                {
                    frameX += rightWidth;
                }
                else
                {
                    frameX += frameWidth;
                }

                frameIndex++;
            }

            frameX = margin;
            frameY += spacing;

            if (topRow)
            {
                frameY += topHeight;
            }
            else if (bottomRow)
            {
                frameY += bottomHeight;
            }
            else
            {
                frameY += frameHeight;
            }
        }

        return texture;
    };
}
